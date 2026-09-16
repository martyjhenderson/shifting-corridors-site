import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { useTheme } from '../utils/ThemeContext';
import { getGameMasters, MarkdownContent } from '../utils/staticData';
import {
  EDITIONS,
  SYSTEMS,
  TYPES,
  VENUES,
  type Scenario,
} from '../shared/eventSchema';

/**
 * The event submission form.
 *
 * A Game Master opens this with a personal link and fills in six or so fields;
 * the Worker behind it opens a pull request. There is no account, no login and
 * no markdown — the point is that someone who would never touch a CMS can add a
 * game in two minutes.
 *
 * Deliberately not offered here: a free-text venue, an address, and a markdown
 * body. The venue is a list because the lodge plays at five places and the
 * address is then filled in server-side; the body is absent because it is the
 * one field through which a submission could put markup on the page. Anything
 * the form cannot express is still a hand-written file, which is a maintainer's
 * job anyway.
 *
 * Nothing here is a security control. The token in the URL is read but not
 * verified, the honeypot and the timer are trivially bypassed, and every rule
 * the fields imply is enforced again by the Worker against the same schema
 * module. This half exists to be pleasant and to fail early with a useful
 * message; src/shared/eventSchema.ts is where correctness actually lives.
 */

const SUBMIT_URL =
  import.meta.env.VITE_SUBMIT_URL ?? 'https://sc-event-submissions.ravegrunt.workers.dev/';

const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '0x4AAAAAAE5TGYqcXdkNCXox';

/** Read `#t=<token>` without trusting it: the Worker is what verifies. */
function tokenFromHash(hash: string): string | null {
  const match = /[#&]t=([A-Za-z0-9_\-.]+)/.exec(hash);
  return match ? match[1] : null;
}

/**
 * The Game Master slug a token names, for a greeting.
 *
 * Decoding a signed payload client-side proves nothing — anyone can write a
 * token that claims to be anyone. It is used only to say "Hello, Eli"; the
 * Worker re-derives this from the verified signature before recording who
 * submitted.
 */
function claimedGm(token: string | null): string | null {
  if (!token) return null;
  const [body] = token.split('.');
  try {
    const json = atob(body.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { gm?: unknown };
    return typeof payload.gm === 'string' ? payload.gm : null;
  } catch {
    return null;
  }
}

type ScenarioDraft = {
  name: string;
  system: string;
  edition: string;
  type: string;
  levels: string;
  signupUrl: string;
};

const emptyScenario = (): ScenarioDraft => ({
  name: '',
  system: 'Pathfinder',
  edition: '',
  type: 'Scenario',
  levels: '',
  signupUrl: '',
});

interface TurnstileWindow extends Window {
  turnstile?: {
    render: (el: HTMLElement, options: Record<string, unknown>) => string;
    reset: (id?: string) => void;
  };
}

const SubmitEvent: React.FC = () => {
  const { theme } = useTheme();

  const token = useMemo(() => tokenFromHash(window.location.hash), []);
  const gmSlug = useMemo(() => claimedGm(token), [token]);

  const [gamemasters, setGamemasters] = useState<MarkdownContent[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState(VENUES[0].name);
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('21:30');
  const [playerCap, setPlayerCap] = useState('6');
  const [intro, setIntro] = useState('');
  const [scenarios, setScenarios] = useState<ScenarioDraft[]>([emptyScenario()]);

  /** Hidden from people, irresistible to a form-filling bot. */
  const [honeypot, setHoneypot] = useState('');

  const openedAt = useRef(Date.now());
  const turnstileToken = useRef<string | null>(null);
  const turnstileEl = useRef<HTMLDivElement | null>(null);

  const [status, setStatus] = useState<'editing' | 'sending' | 'sent'>('editing');
  const [errors, setErrors] = useState<string[]>([]);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [turnstileBlocked, setTurnstileBlocked] = useState(false);

  // Only when there is a link to greet somebody through: without one the page
  // renders an explanation and never needs the roster.
  useEffect(() => {
    if (!token) return;
    getGameMasters().then(setGamemasters).catch(() => setGamemasters([]));
  }, [token]);

  // Turnstile's script is loaded here rather than in index.html so that the rest
  // of the site never pays for it.
  useEffect(() => {
    if (!token) return;

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    // An ad-blocker or a strict network can stop this loading. Say so here
    // rather than letting it surface as a baffling rejection after a round trip.
    script.onerror = () => setTurnstileBlocked(true);
    script.onload = () => {
      const w = window as TurnstileWindow;
      if (w.turnstile && turnstileEl.current) {
        w.turnstile.render(turnstileEl.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (value: string) => {
            turnstileToken.current = value;
          },
          'expired-callback': () => {
            turnstileToken.current = null;
          },
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [token]);

  const greeting = useMemo(() => {
    const match = gamemasters.find(gm => gm.slug === gmSlug);
    const first = match?.meta.firstName;
    return first ? `Hello, ${first}` : 'Add an event';
  }, [gamemasters, gmSlug]);

  const updateScenario = useCallback((index: number, patch: Partial<ScenarioDraft>) => {
    setScenarios(current => current.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }, []);

  const submit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    setErrors([]);

    // The Worker will refuse a submission with no Turnstile token, so catching
    // it here saves a round trip and, more to the point, lets the message say
    // something a Game Master can act on.
    if (!turnstileToken.current) {
      setErrors([
        turnstileBlocked
          ? 'The "are you human?" check could not load. An ad-blocker or privacy extension is the usual cause — turn it off for this page and reload.'
          : 'The "are you human?" check hasn’t finished yet. Give it a moment and try again.',
      ]);
      return;
    }

    setStatus('sending');

    // Trimmed to what the schema accepts: a blank optional field must be absent
    // rather than an empty string, which would fail validation as "must not be
    // blank".
    const cleanScenarios: Partial<Scenario>[] = scenarios.map(s => {
      const out: Record<string, unknown> = { name: s.name.trim() };
      if (s.system) out.system = s.system;
      if (s.edition) out.edition = s.edition;
      if (s.type) out.type = s.type;
      if (s.levels.trim()) out.levels = s.levels.trim();
      if (s.signupUrl.trim()) out.signupUrl = s.signupUrl.trim();
      return out as Partial<Scenario>;
    });

    const event: Record<string, unknown> = {
      title: title.trim(),
      date,
      location,
      scenarios: cleanScenarios,
    };
    if (allDay) {
      event.allDay = true;
    } else {
      event.startTime = startTime;
      if (endTime) event.endTime = endTime;
    }
    if (playerCap) event.playerCap = Number(playerCap);
    if (intro.trim()) event.intro = intro.trim();

    try {
      const response = await fetch(SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          turnstileToken: turnstileToken.current,
          elapsedMs: Date.now() - openedAt.current,
          website: honeypot,
          event,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
        errors?: string[];
        url?: string;
      };

      if (!response.ok) {
        setErrors(body.errors?.length ? body.errors : [body.message ?? 'That did not go through.']);
        setStatus('editing');
        (window as TurnstileWindow).turnstile?.reset();
        turnstileToken.current = null;
        return;
      }

      setPrUrl(body.url ?? null);
      setStatus('sent');
    } catch {
      setErrors(['Could not reach the site. Check your connection and try again.']);
      setStatus('editing');
    }
  };

  if (!token) {
    return (
      <Panel theme={theme}>
        <Heading theme={theme}>This link isn’t valid</Heading>
        <p>
          Event submissions need the personal link you were sent. If you’ve lost it, or it has
          stopped working, ask a Lodge organizer for a new one.
        </p>
        <BackLink to="/">Back to the calendar</BackLink>
      </Panel>
    );
  }

  if (status === 'sent') {
    return (
      <Panel theme={theme}>
        <Heading theme={theme}>Thank you — that’s been sent</Heading>
        <p>
          Your event is waiting to be reviewed, and will appear on the calendar once it’s approved.
          You don’t need to do anything else.
        </p>
        {prUrl && (
          <p>
            <a href={prUrl} target="_blank" rel="noreferrer">
              Follow its progress
            </a>
          </p>
        )}
        <BackLink to="/">Back to the calendar</BackLink>
      </Panel>
    );
  }

  return (
    <Panel theme={theme}>
      <Heading theme={theme}>{greeting}</Heading>
      <Lede>
        Fill this in and the event goes to a Lodge organizer for a quick check before it appears on
        the calendar.
      </Lede>

      {errors.length > 0 && (
        <Problems theme={theme} role="alert">
          <strong>{errors.length === 1 ? 'One thing to fix' : 'A few things to fix'}:</strong>
          <ul>
            {errors.map(error => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Problems>
      )}

      <form onSubmit={submit}>
        <Field>
          <label htmlFor="title">What’s the event called?</label>
          <input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
            required
            placeholder="Pathfinder Society at Tempest Games"
          />
        </Field>

        <Row>
          <Field>
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </Field>

          <Field>
            <label htmlFor="location">Where</label>
            <select id="location" value={location} onChange={e => setLocation(e.target.value)}>
              {VENUES.map(venue => (
                <option key={venue.name} value={venue.name}>
                  {venue.name}
                </option>
              ))}
            </select>
          </Field>
        </Row>

        <Check>
          <input
            id="allDay"
            type="checkbox"
            checked={allDay}
            onChange={e => setAllDay(e.target.checked)}
          />
          <label htmlFor="allDay">All day (a convention, for example) — no set start time</label>
        </Check>

        {!allDay && (
          <Row>
            <Field>
              <label htmlFor="startTime">Starts</label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
              />
            </Field>
            <Field>
              <label htmlFor="endTime">Ends</label>
              <input id="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </Field>
          </Row>
        )}

        <Row>
          <Field>
            <label htmlFor="playerCap">Seats per table</label>
            <input
              id="playerCap"
              type="number"
              min={1}
              max={12}
              value={playerCap}
              onChange={e => setPlayerCap(e.target.value)}
            />
          </Field>
        </Row>

        <Field>
          <label htmlFor="intro">A sentence about it (optional)</label>
          <textarea
            id="intro"
            value={intro}
            onChange={e => setIntro(e.target.value)}
            maxLength={400}
            rows={2}
            placeholder="Join us for Pathfinder Society games at Tempest Games!"
          />
        </Field>

        <SubHeading theme={theme}>What’s being run</SubHeading>

        {scenarios.map((scenario, index) => (
          <ScenarioBlock key={index} theme={theme}>
            <Field>
              <label htmlFor={`name-${index}`}>Scenario or adventure</label>
              <input
                id={`name-${index}`}
                value={scenario.name}
                onChange={e => updateScenario(index, { name: e.target.value })}
                maxLength={160}
                required
              />
            </Field>

            <Row>
              <Field>
                <label htmlFor={`system-${index}`}>System</label>
                <select
                  id={`system-${index}`}
                  value={scenario.system}
                  onChange={e => updateScenario(index, { system: e.target.value })}
                >
                  {SYSTEMS.map(system => (
                    <option key={system}>{system}</option>
                  ))}
                </select>
              </Field>

              <Field>
                <label htmlFor={`edition-${index}`}>Edition</label>
                <select
                  id={`edition-${index}`}
                  value={scenario.edition}
                  onChange={e => updateScenario(index, { edition: e.target.value })}
                >
                  <option value="">Not specified</option>
                  {EDITIONS.map(edition => (
                    <option key={edition}>{edition}</option>
                  ))}
                </select>
              </Field>

              <Field>
                <label htmlFor={`type-${index}`}>Type</label>
                <select
                  id={`type-${index}`}
                  value={scenario.type}
                  onChange={e => updateScenario(index, { type: e.target.value })}
                >
                  {TYPES.map(type => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </Field>

              <Field>
                <label htmlFor={`levels-${index}`}>Levels</label>
                <input
                  id={`levels-${index}`}
                  value={scenario.levels}
                  onChange={e => updateScenario(index, { levels: e.target.value })}
                  placeholder="1-4"
                />
              </Field>
            </Row>

            <Field>
              <label htmlFor={`signup-${index}`}>Sign-up link</label>
              <input
                id={`signup-${index}`}
                value={scenario.signupUrl}
                onChange={e => updateScenario(index, { signupUrl: e.target.value })}
                placeholder="https://www.rpgchronicles.net/session/…"
              />
              <Hint>From RPG Chronicles or Tabletop.events — other sites aren’t accepted.</Hint>
            </Field>

            {scenarios.length > 1 && (
              <Remove
                type="button"
                theme={theme}
                onClick={() => setScenarios(current => current.filter((_, i) => i !== index))}
              >
                Remove this one
              </Remove>
            )}
          </ScenarioBlock>
        ))}

        {scenarios.length < 12 && (
          <Secondary
            type="button"
            theme={theme}
            onClick={() => setScenarios(current => [...current, emptyScenario()])}
          >
            Add another table
          </Secondary>
        )}

        {/* Hidden from people; a bot that fills every field trips it. */}
        <Honeypot aria-hidden="true">
          <label htmlFor="website">Leave this empty</label>
          <input
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
          />
        </Honeypot>

        <div ref={turnstileEl} />

        <Submit theme={theme} type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send it in'}
        </Submit>
      </form>
    </Panel>
  );
};

const Panel = styled.div<{ theme: any }>`
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-family: ${props => props.theme.fonts.main};
  border: 1px solid ${props => props.theme.colors.primary}33;
  border-radius: 8px;
  padding: 24px;
  max-width: 760px;
  margin: 0 auto;
`;

const Heading = styled.h1<{ theme: any }>`
  font-family: ${props => props.theme.fonts.heading};
  color: ${props => props.theme.colors.primary};
  margin-top: 0;
`;

const SubHeading = styled.h2<{ theme: any }>`
  font-family: ${props => props.theme.fonts.heading};
  color: ${props => props.theme.colors.primary};
  font-size: 1.2rem;
  margin: 28px 0 8px;
`;

const Lede = styled.p`
  margin-top: 0;
  opacity: 0.85;
`;

const Hint = styled.small`
  display: block;
  margin-top: 4px;
  opacity: 0.75;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
  flex: 1 1 180px;

  label {
    font-weight: bold;
    font-size: 0.95rem;
  }

  input,
  select,
  textarea {
    font: inherit;
    padding: 8px;
    border: 1px solid currentColor;
    border-radius: 4px;
    background: white;
    color: #222;
  }
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
`;

const Check = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
`;

const ScenarioBlock = styled.div<{ theme: any }>`
  border-left: 3px solid ${props => props.theme.colors.accent};
  padding: 12px 0 4px 14px;
  margin-bottom: 18px;
`;

const Problems = styled.div<{ theme: any }>`
  border: 1px solid ${props => props.theme.colors.secondary};
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 18px;

  ul {
    margin: 8px 0 0;
    padding-left: 20px;
  }
`;

const Submit = styled.button<{ theme: any }>`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 22px;
  font-family: ${props => props.theme.fonts.main};
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 18px;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const Secondary = styled.button<{ theme: any }>`
  background: none;
  color: ${props => props.theme.colors.primary};
  border: 1px dashed ${props => props.theme.colors.primary};
  border-radius: 4px;
  padding: 8px 14px;
  font-family: ${props => props.theme.fonts.main};
  cursor: pointer;
`;

const Remove = styled.button<{ theme: any }>`
  background: none;
  border: none;
  color: ${props => props.theme.colors.secondary};
  cursor: pointer;
  padding: 0;
  font-family: ${props => props.theme.fonts.main};
  text-decoration: underline;
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-top: 16px;
`;

/**
 * Off-screen rather than `display: none`: some bots skip hidden inputs, and a
 * screen reader is told to ignore it by the aria-hidden on the wrapper.
 */
const Honeypot = styled.div`
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`;

export default SubmitEvent;

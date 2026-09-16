import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import SubmitEvent from '../components/SubmitEvent';
import { ThemeProvider } from '../utils/ThemeContext';
import { VENUES } from '../shared/eventSchema';

/** A token the page can read a name out of. Unsigned: the page never verifies. */
function fakeToken(gm = 'eli-f'): string {
  const body = btoa(JSON.stringify({ gm, exp: 9_999_999_999 }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${body}.notarealsignature`;
}

function setHash(value: string) {
  window.location.hash = value;
}

/**
 * Stand in for the Turnstile script, which never loads under jsdom.
 *
 * Stubs `window.turnstile` and fires the injected script's onload, which is
 * what the browser does once the widget is ready; the stubbed `render`
 * immediately invokes the callback the way a solved widget would.
 */
async function solveTurnstile(value = 'turnstile-test-token') {
  (window as any).turnstile = {
    render: (_el: HTMLElement, options: any) => {
      options.callback(value);
      return 'widget-id';
    },
    reset: () => {},
  };

  const script = document.querySelector<HTMLScriptElement>('script[src*="turnstile"]');
  await act(async () => {
    script?.onload?.(new Event('load'));
  });
}

/** Simulate the script being blocked outright, as an ad-blocker would. */
async function blockTurnstile() {
  const script = document.querySelector<HTMLScriptElement>('script[src*="turnstile"]');
  await act(async () => {
    script?.onerror?.(new Event('error'));
  });
}

const renderPage = () =>
  render(
    <ThemeProvider>
      <MemoryRouter>
        <SubmitEvent />
      </MemoryRouter>
    </ThemeProvider>
  );

/** Capture what the page would POST, without letting it reach the network. */
function captureSubmit(response: { status: number; body: unknown }) {
  const calls: Array<{ url: string; body: any }> = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation((async (url: any, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body ?? '{}')) });
    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch);
  return calls;
}

beforeEach(() => {
  setHash('');
  vi.restoreAllMocks();
  delete (window as any).turnstile;
  document.querySelectorAll('script[src*="turnstile"]').forEach(el => el.remove());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('without a valid link', () => {
  test('shows an explanation instead of a form', () => {
    renderPage();

    expect(screen.getByText(/link isn’t valid/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/what’s the event called/i)).not.toBeInTheDocument();
  });

  test('a hash that is not a token is treated as no token', () => {
    setHash('#something-else');
    renderPage();

    expect(screen.getByText(/link isn’t valid/i)).toBeInTheDocument();
  });
});

describe('with a link', () => {
  beforeEach(() => setHash(`#t=${fakeToken()}`));

  test('shows the form', async () => {
    renderPage();
    expect(await screen.findByLabelText(/what’s the event called/i)).toBeInTheDocument();
  });

  test('offers only the known venues, so no address is ever typed', async () => {
    renderPage();

    const select = (await screen.findByLabelText(/^where$/i)) as HTMLSelectElement;
    const offered = Array.from(select.options).map(o => o.value).sort();

    expect(offered).toEqual(VENUES.map(v => v.name).sort());
    expect(screen.queryByLabelText(/address/i)).not.toBeInTheDocument();
  });

  // The body is the one field through which a submission could put markup on
  // the page, so its absence is worth asserting rather than assuming.
  test('offers no markdown or body field', async () => {
    renderPage();
    await screen.findByLabelText(/what’s the event called/i);

    expect(screen.queryByLabelText(/body|markdown|content/i)).not.toBeInTheDocument();
  });

  test('greets the Game Master the token names', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Eli/));
  });

  test('falls back to a neutral heading when the token names nobody we know', async () => {
    setHash(`#t=${fakeToken('nobody-at-all')}`);
    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/add an event/i)
    );
  });

  test('sends the token, a fill time, and the event', async () => {
    const user = userEvent.setup();
    const calls = captureSubmit({ status: 201, body: { ok: true, url: 'https://gh/pr/1' } });

    renderPage();
    await solveTurnstile();
    await user.type(await screen.findByLabelText(/what’s the event called/i), 'Games at Tempest');
    await user.type(screen.getByLabelText(/^date$/i), '2026-11-05');
    await user.type(screen.getByLabelText(/scenario or adventure/i), 'The Winter Queen');
    await user.click(screen.getByRole('button', { name: /send it in/i }));

    await waitFor(() => expect(calls).toHaveLength(1));

    const sent = calls[0].body;
    expect(sent.token).toContain('.');
    expect(typeof sent.elapsedMs).toBe('number');
    expect(sent.event.title).toBe('Games at Tempest');
    expect(sent.event.location).toBe(VENUES[0].name);
    // Never sent, because it is never asked for.
    expect(sent.event.address).toBeUndefined();
  });

  test('omits blank optional fields rather than sending empty strings', async () => {
    const user = userEvent.setup();
    const calls = captureSubmit({ status: 201, body: { ok: true, url: null } });

    renderPage();
    await solveTurnstile();
    await user.type(await screen.findByLabelText(/what’s the event called/i), 'Games');
    await user.type(screen.getByLabelText(/^date$/i), '2026-11-05');
    await user.type(screen.getByLabelText(/scenario or adventure/i), 'Something');
    await user.click(screen.getByRole('button', { name: /send it in/i }));

    await waitFor(() => expect(calls).toHaveLength(1));

    const scenario = calls[0].body.event.scenarios[0];
    expect(scenario).not.toHaveProperty('levels');
    expect(scenario).not.toHaveProperty('signupUrl');
    expect(calls[0].body.event).not.toHaveProperty('intro');
  });

  test('drops the times when the event is all day', async () => {
    const user = userEvent.setup();
    const calls = captureSubmit({ status: 201, body: { ok: true, url: null } });

    renderPage();
    await solveTurnstile();
    await user.type(await screen.findByLabelText(/what’s the event called/i), 'Convention');
    await user.type(screen.getByLabelText(/^date$/i), '2026-11-05');
    await user.click(screen.getByLabelText(/all day/i));
    await user.type(screen.getByLabelText(/scenario or adventure/i), 'Open tables');
    await user.click(screen.getByRole('button', { name: /send it in/i }));

    await waitFor(() => expect(calls).toHaveLength(1));

    expect(calls[0].body.event.allDay).toBe(true);
    expect(calls[0].body.event.startTime).toBeUndefined();
    expect(calls[0].body.event.endTime).toBeUndefined();
  });

  test('shows the validation errors the Worker sends back', async () => {
    const user = userEvent.setup();
    captureSubmit({
      status: 422,
      body: { message: 'Some details need fixing.', errors: ['date is in the past'] },
    });

    renderPage();
    await solveTurnstile();
    await user.type(await screen.findByLabelText(/what’s the event called/i), 'Games');
    await user.type(screen.getByLabelText(/^date$/i), '2020-01-01');
    await user.type(screen.getByLabelText(/scenario or adventure/i), 'Something');
    await user.click(screen.getByRole('button', { name: /send it in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('date is in the past');
    // Still editable, with what was typed intact.
    expect(screen.getByLabelText(/what’s the event called/i)).toHaveValue('Games');
  });

  test('explains an expired link in the words the Worker used', async () => {
    const user = userEvent.setup();
    captureSubmit({ status: 403, body: { message: 'This link has expired. Ask for a new one.' } });

    renderPage();
    await solveTurnstile();
    await user.type(await screen.findByLabelText(/what’s the event called/i), 'Games');
    await user.type(screen.getByLabelText(/^date$/i), '2026-11-05');
    await user.type(screen.getByLabelText(/scenario or adventure/i), 'Something');
    await user.click(screen.getByRole('button', { name: /send it in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/expired/i);
  });

  test('confirms success without asking for anything else', async () => {
    const user = userEvent.setup();
    captureSubmit({ status: 201, body: { ok: true, url: 'https://github.com/o/r/pull/7' } });

    renderPage();
    await solveTurnstile();
    await user.type(await screen.findByLabelText(/what’s the event called/i), 'Games');
    await user.type(screen.getByLabelText(/^date$/i), '2026-11-05');
    await user.type(screen.getByLabelText(/scenario or adventure/i), 'Something');
    await user.click(screen.getByRole('button', { name: /send it in/i }));

    expect(await screen.findByText(/that’s been sent/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /follow its progress/i })).toHaveAttribute(
      'href',
      'https://github.com/o/r/pull/7'
    );
  });

  test('says something useful when the network is down', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    renderPage();
    await solveTurnstile();
    await user.type(await screen.findByLabelText(/what’s the event called/i), 'Games');
    await user.type(screen.getByLabelText(/^date$/i), '2026-11-05');
    await user.type(screen.getByLabelText(/scenario or adventure/i), 'Something');
    await user.click(screen.getByRole('button', { name: /send it in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach/i);
  });

  test('a second table can be added and removed', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByLabelText(/what’s the event called/i);

    expect(screen.getAllByLabelText(/scenario or adventure/i)).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /add another table/i }));
    expect(screen.getAllByLabelText(/scenario or adventure/i)).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: /remove this one/i })[0]);
    expect(screen.getAllByLabelText(/scenario or adventure/i)).toHaveLength(1);
  });

  test('carries the honeypot field, empty, for a bot to trip over', async () => {
    renderPage();
    await screen.findByLabelText(/what’s the event called/i);

    const honeypot = document.querySelector('#website') as HTMLInputElement;
    expect(honeypot).toBeTruthy();
    expect(honeypot.value).toBe('');
    // Hidden from people without display:none, which some bots skip.
    expect(honeypot.closest('[aria-hidden="true"]')).toBeTruthy();
  });

  test('refuses to send before the human check has finished, without a round trip', async () => {
    const user = userEvent.setup();
    const calls = captureSubmit({ status: 201, body: { ok: true } });

    renderPage();
    await user.type(await screen.findByLabelText(/what’s the event called/i), 'Games');
    await user.type(screen.getByLabelText(/^date$/i), '2026-11-05');
    await user.type(screen.getByLabelText(/scenario or adventure/i), 'Something');
    await user.click(screen.getByRole('button', { name: /send it in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/hasn’t finished/i);
    expect(calls).toHaveLength(0);
  });

  test('blames the ad-blocker when the check could not load at all', async () => {
    const user = userEvent.setup();
    const calls = captureSubmit({ status: 201, body: { ok: true } });

    renderPage();
    await screen.findByLabelText(/what’s the event called/i);
    await blockTurnstile();

    await user.type(screen.getByLabelText(/what’s the event called/i), 'Games');
    await user.type(screen.getByLabelText(/^date$/i), '2026-11-05');
    await user.type(screen.getByLabelText(/scenario or adventure/i), 'Something');
    await user.click(screen.getByRole('button', { name: /send it in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/ad-blocker/i);
    expect(calls).toHaveLength(0);
  });

  test('sends the Turnstile token the widget produced', async () => {
    const user = userEvent.setup();
    const calls = captureSubmit({ status: 201, body: { ok: true, url: null } });

    renderPage();
    await solveTurnstile('a-specific-token');
    await user.type(await screen.findByLabelText(/what’s the event called/i), 'Games');
    await user.type(screen.getByLabelText(/^date$/i), '2026-11-05');
    await user.type(screen.getByLabelText(/scenario or adventure/i), 'Something');
    await user.click(screen.getByRole('button', { name: /send it in/i }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].body.turnstileToken).toBe('a-specific-token');
  });
});

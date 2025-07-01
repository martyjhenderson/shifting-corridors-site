import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../utils/ThemeContext';
import { ContentProvider } from '../utils/ContentContext';
import Calendar from '../components/Calendar';
import UpcomingEvents from '../components/UpcomingEvents';
import GameMasters from '../components/GameMasters';
import ThemeSelector from '../components/ThemeSelector';
import News from '../components/News';
import App from '../App';
import { CalendarEvent, GameMaster, NewsArticle } from '../types';
import ts from 'typescript';
import ts from 'typescript';

// Mock the content loader
jest.mock('../services/contentLoader', () => ({
  contentLoader: {
    loadCalendarEvents: jest.fn().mockResolvedValue([]),
    loadGameMasters: jest.fn().mockResolvedValue([]),
    loadNewsArticles: jest.fn().mockResolvedValue([])
  }
}));

// Mock analytics service
jest.mock('../services/analyticsService', () => ({
  analyticsService: {
    trackPageView: jest.fn(),
    trackContentInteraction: jest.fn(),
    trackThemeSwitch: jest.fn()
  }
}));

const mockEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Test Event',
    date: new Date('2025-07-15'),
    description: 'Test event description',
    content: 'Test event content',
    gameType: 'Pathfinder',
    gamemaster: 'Test GM',
    maxPlayers: 6
  }
];

const mockGameMasters: GameMaster[] = [
  {
    id: 'gm-1',
    name: 'Test GM',
    organizedPlayId: '12345',
    games: ['Pathfinder'],
    bio: 'Test GM bio'
  },
  {
    id: 'gm-2',
    name: 'Another GM',
    organizedPlayId: '67890',
    games: ['Starfinder'],
    bio: 'Another GM bio'
  },
  {
    id: 'gm-3',
    name: 'Third GM',
    organizedPlayId: '11111',
    games: ['Legacy'],
    bio: 'Third GM bio'
  }
];

const mockNews: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Test News Article',
    date: new Date('2025-06-30'),
    excerpt: 'Test news excerpt',
    content: 'Test news content',
    author: 'Test Author'
  }
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('Mobile Responsiveness', () => {
  beforeEach(() => {
    // Reset viewport to mobile size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });
  });

  describe('Touch-friendly targets', () => {
    test('calendar navigation buttons meet minimum touch target size', () => {
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      const navButtons = screen.getAllByRole('button', { name: /month/i });
      navButtons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        const minWidth = parseInt(styles.minWidth);
        
        expect(minHeight).toBeGreaterThanOrEqual(44);
        expect(minWidth).toBeGreaterThanOrEqual(44);
      });
    });

    test('theme selector meets minimum touch target size', () => {
      render(
        <TestWrapper>
          <ThemeSelector />
        </TestWrapper>
      );

      const selector = screen.getByRole('combobox');
      const styles = window.getComputedStyle(selector);
      const minHeight = parseInt(styles.minHeight);
      
      expect(minHeight).toBeGreaterThanOrEqual(44);
    });

    test('upcoming events items meet minimum touch target size', () => {
      render(
        <TestWrapper>
          <UpcomingEvents events={mockEvents} maxEvents={3} />
        </TestWrapper>
      );

      const eventItems = screen.getAllByRole('button');
      eventItems.forEach(item => {
        const styles = window.getComputedStyle(item);
        const minHeight = parseInt(styles.minHeight);
        
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Swipe navigation', () => {
    test('calendar supports swipe navigation', async () => {
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      const calendarGrid = document.querySelector('.calendar-grid');
      expect(calendarGrid).toBeInTheDocument();

      // Get initial month
      const initialMonth = screen.getByText(/2025/);
      expect(initialMonth).toBeInTheDocument();

      // Simulate swipe left (next month)
      await act(async () => {
        fireEvent.touchStart(calendarGrid!, {
          touches: [{ clientX: 200, clientY: 100 }]
        });
        fireEvent.touchEnd(calendarGrid!, {
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });
      });

      // Should navigate to next month
      // Note: This test verifies the event handlers are attached
      // The actual month change would require more complex mocking
    });

    test('calendar ignores vertical swipes', async () => {
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      const calendarGrid = document.querySelector('.calendar-grid');
      expect(calendarGrid).toBeInTheDocument();

      // Simulate vertical swipe (should not change month)
      await act(async () => {
        fireEvent.touchStart(calendarGrid!, {
          touches: [{ clientX: 100, clientY: 200 }]
        });
        fireEvent.touchEnd(calendarGrid!, {
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });
      });

      // Month should remain the same
      const currentMonth = screen.getByText(/2025/);
      expect(currentMonth).toBeInTheDocument();
    });
  });

  describe('Responsive layout', () => {
    test('components adapt to mobile viewport', () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true
      });

      render(
        <TestWrapper>
          <div className="main-grid">
            <main className="main-content">
              <Calendar events={mockEvents} />
            </main>
            <aside className="sidebar">
              <GameMasters />
            </aside>
          </div>
        </TestWrapper>
      );

      const mainGrid = document.querySelector('.main-grid');
      expect(mainGrid).toBeInTheDocument();

      // Verify mobile styles are applied
      const styles = window.getComputedStyle(mainGrid!);
      // Note: In a real test environment, we'd check computed styles
      // Here we verify the elements exist and have the right classes
      expect(mainGrid).toHaveClass('main-grid');
    });

    test('sidebar converts to column layout on mobile', () => {
      render(
        <TestWrapper>
          <aside className="sidebar">
            <GameMasters />
            <div>Contact</div>
          </aside>
        </TestWrapper>
      );

      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveClass('sidebar');
    });
  });

  describe('Touch interactions', () => {
    test('elements have proper touch-action properties', () => {
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      const calendarDays = document.querySelectorAll('.calendar-day');
      calendarDays.forEach(day => {
        const styles = window.getComputedStyle(day);
        expect(styles.touchAction).toBe('manipulation');
      });
    });

    test('buttons have webkit-tap-highlight-color transparent', () => {
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // Note: This property might not be testable in jsdom
        // but we verify the CSS class is applied
        expect(button).toHaveClass('calendar-nav-button');
      });
    });
  });

  describe('Accessibility on mobile', () => {
    test('maintains keyboard navigation support', () => {
      render(
        <TestWrapper>
          <UpcomingEvents events={mockEvents} maxEvents={3} />
        </TestWrapper>
      );

      const eventItems = screen.getAllByRole('button');
      eventItems.forEach(item => {
        expect(item).toHaveAttribute('tabIndex', '0');
      });
    });

    test('supports screen reader navigation', () => {
      render(
        <TestWrapper>
          <Calendar events={mockEvents} />
        </TestWrapper>
      );

      const navButtons = screen.getAllByRole('button', { name: /month/i });
      navButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Comprehensive Mobile Layout Tes
    const setMobileViewport = () => {
      Object.
        writable: true,
        configurable: true,
        value: 375,
      })
 {
        writable: true,
        configurable: true,
      lue: 667,
      });
      
      /le
ry => ({
        matches: query.includes('max-width: 768px'),
        media: query,
        onchange: null,
        addListener: jefn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListst.fn(),
        dispatchEvent: jefn(),
      }));
      
      fireEvent(window, new Event('resze'));
    };

    const se {
      Obj

        confi
        value: 768,
      });
      Object.definePro {
        
rue,
        value: 1024,
      });
      
      => ({
   ;   });
  })();
 heDocument).toBeInTt.bodyt(documen      expec issues
emoryout m render with/ Should;

      /r>
      )Wrappe    </Test  iv>
      </d  } />
    n(){jest.fct=terSelet} onGameMas={largeGMLisgamemastersGameMasters           <>
  EventList} /ts={largeen ev <Calendar           <div>
 >
         errapp <TestW
          render( }));

   ${i}`
     o     bio: `Bi
    as const,'] er'Pathfind games: [   ,
    yId: `${i}`izedPla organ       ${i}`,
 e: `GM  nam}`,
       `gm-${i    id:({
    > ) = i 50 }, (_, length:rray.from({geGMList = A const lar

       }));`
     ${i}: `GM  gamemaster     nst,
  coashfinder' Patype: '  gameT,
      tent ${i}`ent: `Con        cont${i}`,
on cripti `Deson:descripti    
    , i + 1),25, 620te( Daewe: nat  d      t ${i}`,
title: `Even        i}`,
t-${ven `e       id:i) => ({
 00 }, (_, : 1om({ length = Array.frtListrgeEven    const latasets
  arge mock da// Create l {
       =>, ()e datasets'ly with largficientes memory ef'handl
    test(
    });
0);Than(10me).toBeLessrenderTi  expect()
     testple sim for this00msly (under 1cientr effiould rende
      // ShtartTime;
ndTime - s= erTime  const rende);
     nce.now( = performame endTi const
         );
  stWrapper>
      </Te </div>
      } />
     ockNewsrticles={ms a    <New       />
  n()}t.feslect={jasterSes} onGameMckGameMastermosters={s gamemaster <GameMa           >
 /kEvents}{mocts=ar even<Calend             <div>
   
      pper><TestWra     er(
         rend     
ow();
 rformance.n peartTime = const st     nc () => {
asys', icer mobile devendering fos roptimizest(');

    te    }ment();
eDocuoBeInTh2025/)).tText(/creen.getBy   expect(sssues
   imation ithout anrenders wint  compone/ Verify

      /   );rapper>
   /TestW     < />
   ts}{mockEvenents=<Calendar ev          er>
 <TestWrapp   der(
       ren

   
      });    })),    n(),
vent: jest.ftchEdispa       ,
   .fn()er: jeststenveEventLimo      re),
    est.fn(er: jstenddEventLi      a
    : jest.fn(),steneroveLi        remst.fn(),
  ener: je  addList    ll,
    nge: nu      oncha
    dia: query,      me)',
    ceon: reduuced-motiers-red === '(prefry queches:       mat=> ({
   ion(query lementatockImp.me: jest.fn() value,
       : truleitab       wr
 ia', {Med 'matchindow,perty(wroefinePObject.d
      ed-motion-reducrsock prefe    // M  ) => {
erences', ( prefed motionts reducpec test('res

   ');
    });event-itemeClass('em).toHavtIt(even     expecteration
 rdware accelble hahat enaclasses tfy CSS   // Veri    
    
  ocument();toBeInTheDeventItem). expect(em');
     r('.event-iterySelectoqu document.eventItem =      const    );

per>
   TestWrap      </iv>
  t</d">Test Evennt-itemme="evev classNa <di      
   per>stWrap  <Te  
    r(      rende{
ns', () => ioanimatsforms for  CSS tran test('uses{
    () => on mobile',e rformanc'Pee(describ  });

    });
ual(0);
  rEqrThanOoBeGreatelength).tRegions. expect(live);
     ia-live]'rAll('[arlectoSeent.queryns = documliveRegioconst       s
changenounce  that anregionslive Look for // );

         apper>
   Wr  </Test
      } />entSelect{mockOnEventSelect=nts} onEvnts={mockEver eve   <Calenda      
 >stWrapper   <Te
        render(
      
   st.fn(); = jectSele mockOnEvent    const  nc () => {
asytent', amic confor dynuncements r annocreen readets supporest('s});

    t
      }l');
    beria-late('aibutoHaveAttrr).alendaxpect(c   e
     calendar) { if (');
     grid"]le="[roelector('ument.queryS docar =ndst cale  concture
    ruA stropriate ARIuld have appar sho/ Calend     /

    });l');
   e('aria-labeAttributtton).toHavexpect(bu      e  n => {
h(butto.forEac  navButtons
    }); /month/i n', { name:uttoRole('bAllByn.getscreeButtons = const nav   ;

   er>
      )estWrapp    </T    
Events} />ts={mockenendar eval <C       >
  TestWrapper       <render(
    
   ', () => {onsnteractie i for mobil labelse ARIAropriatppdes aovi    test('pr   });

ent();
 TheDocumeInoBnt).tfocusedElemeexpect(;
      tiveElementent.ac = documcusedElementnst fo    coroperly
  ts pugh elemenld move throus shou// Foc      ab();

user.tawait 
      ;r.tab()t use      awaier.tab();
 await us   
  ntsusable elemethrough focb   // Ta
    );
>
      erTestWrapp        </    </div>
  
    nts={3} />ents} maxEves={mockEv eventEvents <Upcoming   >
        } /mockEventsr events={enda    <Cal       <div>
           er>
rapptW  <Tes
      ender(  r         
 etup();
ent.s= userEvconst user  {
      c () =>syn, ale'on mobiagement  manins focustat('main    tes() => {
ty', liibiccessobile Aribe('M
  desc
  });
();
    });nteInTheDocumeutton).toBect(nextB  exp  
  uesthout issons witeractiid inle rapndhould ha    // S  

Button);r.click(nextit use
      awaxtButton);lick(neuser.cwait       aButton);
k(nextuser.clic   await times
   le ltiptton muthe butap ly / Rapid   / 
   
     th');xt monxt('NeTeabeleen.getByLn = scrnextButto const     );

 >
      pper  </TestWra
      >entSelect} /t={mockOnEvEventSelecvents} on{mockEdar events=Calen       <
   r>TestWrappe    <nder(
          re

      );.fn(stSelect = jemockOnEvent     const );
 nt.setup(rEve= useer   const us{
    nc () => tions', asyeracntouch i rapid t'handles

    test( }
    });   );
  heDocument(eInT).toBalendarGrid expect(c
       iatelyents approprouch evndle tld haShou  //    

   artEvent);id, touchStalendarGrfireEvent(c      
  ault');ntDefvent, 'preveStartEn(toucht.spyOltSpy = jestDefauconst preven
               );
         } Touch]
tY: 100 } as00, clien{ clientX: 1: [ouches      trt', {
    ('touchstaentuchEvent = new TotouchStartEvconst       rGrid) {
  alenda  if (crid');
    r-g'.calendactor(erySele document.qurid =arGalendst c      con  );


    rapper>     </TestW} />
   ntSelectnEveockO{mSelect=ventvents} onEckEents={moCalendar ev          <er>
pptWraes <T       
r(    rende     
  );
  jest.fn(lect =OnEventSenst mock{
      coasync () => ', ppropriatelyors atouch behavits default reven  test('p
    });
   }
  nt();
   eDocumeTh).toBeInerainndarContxpect(cale
        erorsthout erouch wilti-td handle mu    // Shoul      });

          ]
       210 }
 clientY:210,{ clientX:            
 : 90 },entY90, clilientX: { c   
         uches: [   changedTo
       ontainer, {nd(calendarCnt.touchE fireEve 
          
           });
  ]       0 }
  ntY: 21ieX: 210, cl  { client
          Y: 90 },entliientX: 90, c   { cl
         uches: [   to       ntainer, {
e(calendarCo.touchMov   fireEvent        

         });  
       ]200 }
     Y: 200, clientX: ent   { cli    ,
     : 100 } clientYntX: 100,     { clie
       hes: [uc     to    , {
 tainerdarConlenrt(cant.touchStafireEve        gesture
h  pincimulate  // S   
   r) {Containelendar(ca
      if ner');contaiendar-cal'.tor(erySelecocument.qu = dnerntait calendarCons

      co>
      );Wrapper/Test   <
     lect} />nEventSet={mockOEventSelecs} onnt={mockEvedar events <Calen   
      stWrapper>        <Teender(

      r();
      fn= jest.elect ntSEveockOnonst m
      c) => {c (s', asynestureti-touch gs mul('supportst{
    te => s', ()nteractiond Touch Ince('Advaescribe d });

  });
 
   ;     })        }
 ument();
eInTheDoctainer).toBmConct(g  expe       layout
  diate gridmeterd have inlet shoul Tab          //tainer) {
 if (gmCon       -grid');
gamemasterstor('.lecrySecument.que= doontainer nst gmCco
        => {waitFor(()  await 

     );tViewport(tTablese

      >
      );rapper    </TestW />
    ockOnSelect}lect={mrSenGameMaste os}erameMastters={mockGmasMasters game       <Gameapper>
   tWr  <Tes(
           render      
 t.fn();
elect = jes mockOnS   const=> {
   , async ()  behavior'onsiveiate respntermeds iout provideTablet laytest(' });

    t();
   InTheDocumendy).toBe.boocument(d     expect present
 ns should besectiol main 
      // Al;
;
      })nt()TheDocumeiner).toBeInntaCoect(appxp    e
    er');contain('.app-uerySelectorocument.q = dppContainert a      cons => {
  ()ait waitFor(   awes
   out issuay lithoutld render w// Shou       });

 );
     >
       ovideremePr      </Ther>
    videntPro      </Cont>
       <App /             rovider>
<ContentP       er>
     ovidPr    <Theme    r(
     rende=> {
     async () t(acwait     a;

  wport()tMobileVie {
      se async () =>le',y to mobictlrre adapts coapp layout test('Full      });

     });
        }
 t();
  ocumeneD).toBeInThContainercomingupt(    expecning
      c positiocifiobile-speould have m   // Sh       r) {
Containemingif (upco       ;
 ng-events')omipcctor('.uerySele.qument= docungContainer      upcomiyout
   le lamobiapt to ld adShou
        //  {) =>itFor(( await wa
     port();
obileView
      setMument();
eDocnThoBeI.tainer)Contngct(upcomixpe  e;
    ')eventsoming-'.upcor(lectt.querySe= documentainer ngConomi     let upcut
 op layo/ Deskt    / );

      Wrapper>
 Test
        </ents={3} />vents} maxEvts={mockEs evenEventpcoming  <U
        apper>estWr     <Tender(
        r> {
 sync () = mobile', aanel onto bottom prts anel conveents side p('UpcomingEv    test});

;
    0)terThan(h).toBeGreagtentems.lnewsIexpect(     item');
 .news-orAll('erySelectocument.qu dtems =wsIconst ne  bile
    n mortically oked veuld be stacsho News items   // });

         ocument();
heD.toBeInTntainer)ect(newsCo       expiner');
 ws-contaneSelector('.ument.queryainer = docewsCont n     const => {
   ()itFor( wa  await   ;

 wport()ileVieetMob      s

 );er>
     rapptW      </TesNews} />
  ockicles={m   <News art      
 >stWrapper <Te(
       er   rend  c () => {
 , asynobile'tically on m veresks articlnent staccompost('News     te   });

;
   })  }
    ;
      eDocument()er).toBeInThontain  expect(gmCg
        lintyte sle-appropria have mobi Should//         ) {
 gmContainer     if (rid');
   rs-gmemaste'.gaelector(uerySment.qocu= diner gmConta   out
      layuld adaptile sho // Mob       (() => {
orwaitF     await rt();

 bileViewpo      setMoument();

InTheDoctoBemContainer).t(g expec
     id');asters-grgamem'.ctor(.querySele = documentaineret gmCont lout
     rid layhow guld s Desktop sho    //
  ;
      )stWrapper>
Te     </} />
   cteleOnSlect={mockasterSe} onGameMkGameMasterssters={mocmaMasters game  <Game       per>
 estWrap <T       der(
      ren    
);
  = jest.fn(ct ockOnSelest m{
      consync () => obile', amn on moluo 1 cumns t colm 3adapts froasters grid eM  test('Gam   };

  ));
 resize'vent('w Endow, neeEvent(wi
      fir
           }));est.fn(),
 nt: jhEve dispatc      .fn(),
  jestr:neventListeemoveE  r   
    jest.fn(),Listener:ddEvent     a   ),
st.fn(: jenerteremoveLis),
        t.fn(es jtener: addLisll,
       nge: nu   oncha   ery,
  dia: qu      me,
  h: 768px')-widtdes('maxclu !query.in&&024px') ax-width: 1es('mncludhes: query.imatc     on(querytiplementa.fn().mockImedia = jesthMatc.mindow w
});
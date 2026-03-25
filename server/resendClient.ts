import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

export async function getResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}

export async function sendWelcomeEmail(toEmail: string, userName: string, language: string = 'pt') {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const subjects: Record<string, string> = {
      pt: 'Bem-vindo ao ModelHero!',
      en: 'Welcome to ModelHero!',
      es: 'Bienvenido a ModelHero!',
      fr: 'Bienvenue sur ModelHero!',
      de: 'Willkommen bei ModelHero!',
      it: 'Benvenuto su ModelHero!',
      ru: 'Добро пожаловать в ModelHero!',
      ja: 'ModelHeroへようこそ！'
    };

    const appUrl = 'https://modelhero.replit.app/';
    const loginUrl = 'https://modelhero.replit.app/login';
    
    const buttonStyles = 'display: inline-block; background-color: #3E5641; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;';
    
    const bodies: Record<string, string> = {
      pt: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3E5641;">Bem-vindo ao ModelHero!</h1>
          <p>Olá ${userName},</p>
          <p>Obrigado por se cadastrar no ModelHero! Estamos muito felizes em tê-lo conosco.</p>
          <p>Com o ModelHero, você pode:</p>
          <ul>
            <li>Organizar sua coleção de kits de plastimodelismo</li>
            <li>Acompanhar o progresso das suas montagens</li>
            <li>Registrar horas trabalhadas</li>
            <li>Gerenciar tintas e materiais</li>
            <li>Ver estatísticas do seu hobby</li>
          </ul>
          <p>Comece agora adicionando seu primeiro kit! É muito fácil e rápido - não leva nem um minuto!</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Acessar ModelHero</a>
          </p>
          <p style="margin-top: 30px;">Boas montagens!</p>
          <p>Equipe ModelHero</p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">Acesse: <a href="${appUrl}" style="color: #3E5641;">${appUrl}</a></p>
        </div>
      `,
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3E5641;">Welcome to ModelHero!</h1>
          <p>Hello ${userName},</p>
          <p>Thank you for signing up for ModelHero! We're thrilled to have you with us.</p>
          <p>With ModelHero, you can:</p>
          <ul>
            <li>Organize your plastic model kit collection</li>
            <li>Track your build progress</li>
            <li>Log work hours</li>
            <li>Manage paints and materials</li>
            <li>View hobby statistics</li>
          </ul>
          <p>Start now by adding your first kit!</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Go to ModelHero</a>
          </p>
          <p style="margin-top: 30px;">Happy modeling!</p>
          <p>The ModelHero Team</p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">Visit: <a href="${appUrl}" style="color: #3E5641;">${appUrl}</a></p>
        </div>
      `,
      es: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3E5641;">¡Bienvenido a ModelHero!</h1>
          <p>Hola ${userName},</p>
          <p>¡Gracias por registrarte en ModelHero! Estamos muy felices de tenerte con nosotros.</p>
          <p>Con ModelHero, puedes:</p>
          <ul>
            <li>Organizar tu colección de maquetas</li>
            <li>Seguir el progreso de tus montajes</li>
            <li>Registrar horas de trabajo</li>
            <li>Gestionar pinturas y materiales</li>
            <li>Ver estadísticas de tu hobby</li>
          </ul>
          <p>¡Comienza ahora añadiendo tu primer kit!</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Ir a ModelHero</a>
          </p>
          <p style="margin-top: 30px;">¡Feliz modelismo!</p>
          <p>El Equipo ModelHero</p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">Visita: <a href="${appUrl}" style="color: #3E5641;">${appUrl}</a></p>
        </div>
      `,
      fr: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3E5641;">Bienvenue sur ModelHero!</h1>
          <p>Bonjour ${userName},</p>
          <p>Merci de vous être inscrit sur ModelHero! Nous sommes ravis de vous avoir parmi nous.</p>
          <p>Avec ModelHero, vous pouvez:</p>
          <ul>
            <li>Organiser votre collection de maquettes</li>
            <li>Suivre la progression de vos montages</li>
            <li>Enregistrer les heures de travail</li>
            <li>Gérer peintures et matériaux</li>
            <li>Voir les statistiques de votre hobby</li>
          </ul>
          <p>Commencez maintenant en ajoutant votre premier kit!</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Accéder à ModelHero</a>
          </p>
          <p style="margin-top: 30px;">Bon modélisme!</p>
          <p>L'équipe ModelHero</p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">Visitez: <a href="${appUrl}" style="color: #3E5641;">${appUrl}</a></p>
        </div>
      `,
      de: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3E5641;">Willkommen bei ModelHero!</h1>
          <p>Hallo ${userName},</p>
          <p>Vielen Dank für Ihre Anmeldung bei ModelHero! Wir freuen uns sehr, Sie bei uns zu haben.</p>
          <p>Mit ModelHero können Sie:</p>
          <ul>
            <li>Ihre Modellbausatz-Sammlung organisieren</li>
            <li>Den Fortschritt Ihrer Projekte verfolgen</li>
            <li>Arbeitsstunden protokollieren</li>
            <li>Farben und Materialien verwalten</li>
            <li>Hobby-Statistiken anzeigen</li>
          </ul>
          <p>Beginnen Sie jetzt mit Ihrem ersten Kit!</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Zu ModelHero</a>
          </p>
          <p style="margin-top: 30px;">Viel Spaß beim Modellbau!</p>
          <p>Das ModelHero Team</p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">Besuchen Sie: <a href="${appUrl}" style="color: #3E5641;">${appUrl}</a></p>
        </div>
      `,
      it: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3E5641;">Benvenuto su ModelHero!</h1>
          <p>Ciao ${userName},</p>
          <p>Grazie per esserti iscritto a ModelHero! Siamo molto felici di averti con noi.</p>
          <p>Con ModelHero puoi:</p>
          <ul>
            <li>Organizzare la tua collezione di modellini</li>
            <li>Monitorare i progressi dei tuoi montaggi</li>
            <li>Registrare le ore di lavoro</li>
            <li>Gestire colori e materiali</li>
            <li>Visualizzare le statistiche del tuo hobby</li>
          </ul>
          <p>Inizia ora aggiungendo il tuo primo kit!</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Vai a ModelHero</a>
          </p>
          <p style="margin-top: 30px;">Buon modellismo!</p>
          <p>Il Team ModelHero</p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">Visita: <a href="${appUrl}" style="color: #3E5641;">${appUrl}</a></p>
        </div>
      `,
      ru: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3E5641;">Добро пожаловать в ModelHero!</h1>
          <p>Здравствуйте, ${userName}!</p>
          <p>Спасибо за регистрацию в ModelHero! Мы очень рады видеть вас.</p>
          <p>С ModelHero вы можете:</p>
          <ul>
            <li>Организовать коллекцию моделей</li>
            <li>Отслеживать прогресс сборки</li>
            <li>Записывать часы работы</li>
            <li>Управлять красками и материалами</li>
            <li>Просматривать статистику хобби</li>
          </ul>
          <p>Начните прямо сейчас, добавив свой первый набор!</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Перейти в ModelHero</a>
          </p>
          <p style="margin-top: 30px;">Удачного моделирования!</p>
          <p>Команда ModelHero</p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">Посетите: <a href="${appUrl}" style="color: #3E5641;">${appUrl}</a></p>
        </div>
      `,
      ja: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3E5641;">ModelHeroへようこそ！</h1>
          <p>${userName}様</p>
          <p>ModelHeroにご登録いただきありがとうございます！</p>
          <p>ModelHeroでは以下のことができます：</p>
          <ul>
            <li>プラモデルコレクションの整理</li>
            <li>製作進捗の追跡</li>
            <li>作業時間の記録</li>
            <li>塗料・材料の管理</li>
            <li>趣味の統計表示</li>
          </ul>
          <p>最初のキットを追加して始めましょう！</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">ModelHeroにアクセス</a>
          </p>
          <p style="margin-top: 30px;">楽しいモデリングを！</p>
          <p>ModelHeroチーム</p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">アクセス: <a href="${appUrl}" style="color: #3E5641;">${appUrl}</a></p>
        </div>
      `
    };

    const subject = subjects[language] || subjects.pt;
    const html = bodies[language] || bodies.pt;

    const result = await client.emails.send({
      from: fromEmail || 'ModelHero <noreply@modelhero.app>',
      to: toEmail,
      subject,
      html
    });

    console.log('[Resend] Welcome email sent to:', toEmail, result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Resend] Failed to send welcome email:', error);
    return { success: false, error };
  }
}

export async function sendFollowUp24hEmail(toEmail: string, language: string = 'pt') {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const appUrl = 'https://modelhero.replit.app/';
    const loginUrl = 'https://modelhero.replit.app/login';
    const buttonStyles = 'display: inline-block; background-color: #3E5641; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;';
    
    const subjects: Record<string, string> = {
      pt: 'Seu primeiro kit no ModelHero leva menos de 1 minuto',
      en: 'Your first kit on ModelHero takes less than 1 minute',
      es: 'Tu primer kit en ModelHero tarda menos de 1 minuto',
      fr: 'Votre premier kit sur ModelHero prend moins d\'une minute',
      de: 'Dein erstes Kit auf ModelHero dauert weniger als 1 Minute',
      it: 'Il tuo primo kit su ModelHero richiede meno di 1 minuto',
      ru: 'Ваш первый набор в ModelHero займёт меньше минуты',
      ja: 'ModelHeroでの最初のキット登録は1分もかかりません'
    };

    const bodies: Record<string, string> = {
      pt: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Oi,</p>
          <p>Ontem você criou sua conta no ModelHero — bem-vindo :)</p>
          <p>Muita gente para por aí não por falta de interesse, mas porque acha que vai dar trabalho começar.<br>
          A boa notícia é que não precisa parar e não, não dá trabalho.</p>
          <p>A maioria dos usuários começa cadastrando apenas um kit.<br>
          Isso já é suficiente para entender como tudo funciona e começar a organizar o hobby.</p>
          <p>Você pode:</p>
          <ul>
            <li>preencher só o básico</li>
            <li>usar um link do kit para agilizar</li>
            <li>ou editar e ajustar depois, sem pressa</li>
          </ul>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Cadastrar meu primeiro kit</a>
          </p>
          <p>Quando quiser, o ModelHero está aí para ajudar a deixar tudo no lugar certo.</p>
          <p>Abraço,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hi,</p>
          <p>Yesterday you created your ModelHero account — welcome :)</p>
          <p>Many people stop there not because they're not interested, but because they think it's going to be a lot of work to get started.<br>
          The good news is you don't have to stop, and no, it's not hard at all.</p>
          <p>Most users start by adding just one kit.<br>
          That's enough to understand how everything works and start organizing your hobby.</p>
          <p>You can:</p>
          <ul>
            <li>fill in just the basics</li>
            <li>use a kit link to speed things up</li>
            <li>or edit and adjust later, no rush</li>
          </ul>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Add my first kit</a>
          </p>
          <p>Whenever you're ready, ModelHero is here to help you keep everything in the right place.</p>
          <p>Best,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      es: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hola,</p>
          <p>Ayer creaste tu cuenta en ModelHero — bienvenido :)</p>
          <p>Mucha gente se detiene ahí no por falta de interés, sino porque piensa que va a ser mucho trabajo empezar.<br>
          La buena noticia es que no tienes que parar, y no, no es difícil.</p>
          <p>La mayoría de los usuarios comienzan añadiendo solo un kit.<br>
          Eso es suficiente para entender cómo funciona todo y empezar a organizar tu hobby.</p>
          <p>Puedes:</p>
          <ul>
            <li>completar solo lo básico</li>
            <li>usar un enlace del kit para agilizar</li>
            <li>o editar y ajustar después, sin prisa</li>
          </ul>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Añadir mi primer kit</a>
          </p>
          <p>Cuando quieras, ModelHero está aquí para ayudarte a mantener todo en su lugar.</p>
          <p>Saludos,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      fr: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Bonjour,</p>
          <p>Hier, vous avez créé votre compte ModelHero — bienvenue :)</p>
          <p>Beaucoup de gens s'arrêtent là, non par manque d'intérêt, mais parce qu'ils pensent que ça va être compliqué de commencer.<br>
          La bonne nouvelle, c'est que ce n'est pas du tout le cas.</p>
          <p>La plupart des utilisateurs commencent par ajouter un seul kit.<br>
          C'est suffisant pour comprendre comment tout fonctionne et commencer à organiser votre hobby.</p>
          <p>Vous pouvez :</p>
          <ul>
            <li>remplir juste les informations de base</li>
            <li>utiliser un lien de kit pour aller plus vite</li>
            <li>ou modifier et ajuster plus tard, sans pression</li>
          </ul>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Ajouter mon premier kit</a>
          </p>
          <p>Quand vous serez prêt, ModelHero est là pour vous aider à tout garder bien organisé.</p>
          <p>Cordialement,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      de: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hallo,</p>
          <p>Gestern hast du dein ModelHero-Konto erstellt — willkommen :)</p>
          <p>Viele Leute hören hier auf, nicht aus Desinteresse, sondern weil sie denken, es wäre aufwendig loszulegen.<br>
          Die gute Nachricht: Das ist es überhaupt nicht.</p>
          <p>Die meisten Nutzer starten mit nur einem Kit.<br>
          Das reicht aus, um zu verstehen, wie alles funktioniert, und dein Hobby zu organisieren.</p>
          <p>Du kannst:</p>
          <ul>
            <li>nur die Grunddaten eintragen</li>
            <li>einen Kit-Link nutzen, um es schneller zu machen</li>
            <li>oder später bearbeiten und anpassen, ganz ohne Eile</li>
          </ul>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Mein erstes Kit hinzufügen</a>
          </p>
          <p>Wann immer du bereit bist, ModelHero hilft dir, alles an seinem Platz zu halten.</p>
          <p>Viele Grüße,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      it: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Ciao,</p>
          <p>Ieri hai creato il tuo account ModelHero — benvenuto :)</p>
          <p>Molte persone si fermano qui, non per mancanza di interesse, ma perché pensano che sia complicato iniziare.<br>
          La buona notizia è che non lo è affatto.</p>
          <p>La maggior parte degli utenti inizia aggiungendo un solo kit.<br>
          È sufficiente per capire come funziona tutto e iniziare a organizzare il tuo hobby.</p>
          <p>Puoi:</p>
          <ul>
            <li>compilare solo le informazioni di base</li>
            <li>usare un link del kit per velocizzare</li>
            <li>o modificare e aggiustare dopo, senza fretta</li>
          </ul>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Aggiungi il mio primo kit</a>
          </p>
          <p>Quando vorrai, ModelHero è qui per aiutarti a tenere tutto in ordine.</p>
          <p>Cordiali saluti,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      ru: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Привет,</p>
          <p>Вчера вы создали аккаунт в ModelHero — добро пожаловать :)</p>
          <p>Многие останавливаются на этом этапе не потому, что им неинтересно, а потому что думают, что начать будет сложно.<br>
          Хорошая новость — это совсем не так.</p>
          <p>Большинство пользователей начинают с добавления всего одного набора.<br>
          Этого достаточно, чтобы понять, как всё работает, и начать организовывать своё хобби.</p>
          <p>Вы можете:</p>
          <ul>
            <li>заполнить только основную информацию</li>
            <li>использовать ссылку на набор для ускорения</li>
            <li>или отредактировать и подправить позже, без спешки</li>
          </ul>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Добавить мой первый набор</a>
          </p>
          <p>Когда будете готовы, ModelHero поможет вам держать всё в порядке.</p>
          <p>С уважением,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      ja: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>こんにちは、</p>
          <p>昨日、ModelHeroのアカウントを作成されましたね — ようこそ :)</p>
          <p>多くの方がここで止まってしまいます。興味がないからではなく、始めるのが大変だと思ってしまうからです。<br>
          でもご安心ください、まったく難しくありません。</p>
          <p>ほとんどのユーザーは、まず1つのキットを追加するところから始めます。<br>
          それだけで仕組みが分かり、趣味の整理を始められます。</p>
          <p>できること：</p>
          <ul>
            <li>基本情報だけ入力する</li>
            <li>キットのリンクを使って素早く登録する</li>
            <li>あとから編集・調整する（急ぐ必要はありません）</li>
          </ul>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">最初のキットを追加する</a>
          </p>
          <p>準備ができたら、ModelHeroがすべてを整理するお手伝いをします。</p>
          <p>よろしくお願いします、<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `
    };

    const subject = subjects[language] || subjects.pt;
    const html = bodies[language] || bodies.pt;

    const result = await client.emails.send({
      from: fromEmail || 'ModelHero <noreply@modelhero.app>',
      to: toEmail,
      subject,
      html
    });

    console.log('[Resend] Follow-up 24h email sent to:', toEmail, 'language:', language, result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Resend] Failed to send follow-up 24h email:', error);
    return { success: false, error };
  }
}

export async function sendFollowUp4dEmail(toEmail: string, language: string = 'pt') {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const appUrl = 'https://modelhero.replit.app/';
    const loginUrl = 'https://modelhero.replit.app/login';
    const buttonStyles = 'display: inline-block; background-color: #3E5641; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;';
    
    const subjects: Record<string, string> = {
      pt: 'Como eu uso o ModelHero no meu próprio hobby',
      en: 'How I use ModelHero in my own hobby',
      es: 'Cómo uso ModelHero en mi propio hobby',
      fr: 'Comment j\'utilise ModelHero dans mon propre hobby',
      de: 'Wie ich ModelHero in meinem eigenen Hobby nutze',
      it: 'Come uso ModelHero nel mio hobby',
      ru: 'Как я использую ModelHero в своём хобби',
      ja: '私がModelHeroを自分の趣味でどう使っているか'
    };

    const bodies: Record<string, string> = {
      pt: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Oi,</p>
          <p>Queria te contar rapidamente como eu uso o ModelHero no meu dia a dia de plastimodelista.</p>
          <p>Eu começo sempre pelo básico: cadastro um único kit.<br>
          Sem pensar em organizar tudo de uma vez.</p>
          <p>Depois disso, fica fácil:</p>
          <ul>
            <li>ver o que já tenho</li>
            <li>saber o que está em andamento</li>
            <li>evitar compras repetidas</li>
            <li>ter uma noção real do meu stash</li>
          </ul>
          <p>O ModelHero não é sobre controle excessivo — é sobre tirar a bagunça da cabeça e deixar o hobby mais leve.</p>
          <p>Se fizer sentido para você, comece pelo primeiro kit.<br>
          É assim que tudo começa por aqui.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Cadastrar meu primeiro kit</a>
          </p>
          <p>Abraço,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hi,</p>
          <p>I wanted to quickly tell you how I use ModelHero in my day-to-day as a scale modeler.</p>
          <p>I always start with the basics: I add just one kit.<br>
          Without thinking about organizing everything at once.</p>
          <p>After that, it's easy:</p>
          <ul>
            <li>see what I already have</li>
            <li>know what's in progress</li>
            <li>avoid duplicate purchases</li>
            <li>get a real sense of my stash</li>
          </ul>
          <p>ModelHero isn't about excessive control — it's about clearing the clutter from your head and making the hobby lighter.</p>
          <p>If it makes sense for you, start with your first kit.<br>
          That's how everything starts here.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Add my first kit</a>
          </p>
          <p>Best,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      es: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hola,</p>
          <p>Quería contarte rápidamente cómo uso ModelHero en mi día a día como maquetista.</p>
          <p>Siempre empiezo por lo básico: añado solo un kit.<br>
          Sin pensar en organizar todo de una vez.</p>
          <p>Después de eso, es fácil:</p>
          <ul>
            <li>ver lo que ya tengo</li>
            <li>saber qué está en progreso</li>
            <li>evitar compras duplicadas</li>
            <li>tener una noción real de mi stash</li>
          </ul>
          <p>ModelHero no es sobre control excesivo — es sobre quitar el desorden de tu cabeza y hacer el hobby más ligero.</p>
          <p>Si tiene sentido para ti, empieza con tu primer kit.<br>
          Así es como todo comienza aquí.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Añadir mi primer kit</a>
          </p>
          <p>Saludos,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      fr: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Bonjour,</p>
          <p>Je voulais vous raconter rapidement comment j'utilise ModelHero au quotidien en tant que maquettiste.</p>
          <p>Je commence toujours par les bases : j'ajoute un seul kit.<br>
          Sans chercher à tout organiser d'un coup.</p>
          <p>Après ça, tout devient simple :</p>
          <ul>
            <li>voir ce que j'ai déjà</li>
            <li>savoir ce qui est en cours</li>
            <li>éviter les achats en double</li>
            <li>avoir une vraie vision de mon stock</li>
          </ul>
          <p>ModelHero, ce n'est pas du contrôle excessif — c'est se libérer l'esprit et rendre le hobby plus léger.</p>
          <p>Si ça vous parle, commencez par votre premier kit.<br>
          C'est comme ça que tout commence ici.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Ajouter mon premier kit</a>
          </p>
          <p>Cordialement,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      de: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hallo,</p>
          <p>Ich wollte dir kurz erzählen, wie ich ModelHero in meinem Modellbau-Alltag nutze.</p>
          <p>Ich fange immer mit dem Grundlegenden an: Ich füge nur ein Kit hinzu.<br>
          Ohne daran zu denken, alles auf einmal zu organisieren.</p>
          <p>Danach wird es einfach:</p>
          <ul>
            <li>sehen, was ich schon habe</li>
            <li>wissen, was gerade in Arbeit ist</li>
            <li>doppelte Käufe vermeiden</li>
            <li>einen echten Überblick über meinen Bestand bekommen</li>
          </ul>
          <p>Bei ModelHero geht es nicht um übertriebene Kontrolle — es geht darum, Ordnung im Kopf zu schaffen und das Hobby leichter zu machen.</p>
          <p>Wenn es für dich Sinn macht, fang mit deinem ersten Kit an.<br>
          So fängt hier alles an.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Mein erstes Kit hinzufügen</a>
          </p>
          <p>Viele Grüße,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      it: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Ciao,</p>
          <p>Volevo raccontarti velocemente come uso ModelHero nella mia vita quotidiana da modellista.</p>
          <p>Inizio sempre dalle basi: aggiungo un solo kit.<br>
          Senza pensare di organizzare tutto in una volta.</p>
          <p>Dopo, diventa facile:</p>
          <ul>
            <li>vedere cosa ho già</li>
            <li>sapere cosa è in corso</li>
            <li>evitare acquisti doppi</li>
            <li>avere un'idea reale del mio stash</li>
          </ul>
          <p>ModelHero non è controllo eccessivo — è liberare la mente dal disordine e rendere l'hobby più leggero.</p>
          <p>Se ha senso per te, inizia con il tuo primo kit.<br>
          È così che tutto comincia qui.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Aggiungi il mio primo kit</a>
          </p>
          <p>Cordiali saluti,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      ru: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Привет,</p>
          <p>Хотел быстро рассказать, как я использую ModelHero в своём увлечении моделизмом.</p>
          <p>Я всегда начинаю с основ: добавляю всего один набор.<br>
          Не пытаясь организовать всё сразу.</p>
          <p>После этого всё становится просто:</p>
          <ul>
            <li>видеть, что у меня уже есть</li>
            <li>знать, что в процессе сборки</li>
            <li>избегать повторных покупок</li>
            <li>получить реальное представление о своём запасе</li>
          </ul>
          <p>ModelHero — это не чрезмерный контроль, а способ навести порядок в голове и сделать хобби легче.</p>
          <p>Если вам это подходит, начните с первого набора.<br>
          Именно так всё начинается здесь.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Добавить мой первый набор</a>
          </p>
          <p>С уважением,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      ja: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>こんにちは、</p>
          <p>私がモデラーとして日々ModelHeroをどう使っているか、簡単にお伝えしたいと思います。</p>
          <p>いつも基本から始めます：まず1つのキットだけ追加します。<br>
          一度にすべてを整理しようとは考えません。</p>
          <p>そのあとは簡単です：</p>
          <ul>
            <li>すでに持っているものを確認できる</li>
            <li>製作中のものが分かる</li>
            <li>重複購入を避けられる</li>
            <li>自分のストックの全体像が見える</li>
          </ul>
          <p>ModelHeroは過度な管理のためではありません — 頭の中の散らかりを整理して、趣味をもっと気軽にするためのものです。</p>
          <p>もし良いなと思ったら、最初のキットから始めてみてください。<br>
          ここではそうやって始まります。</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">最初のキットを追加する</a>
          </p>
          <p>よろしくお願いします、<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `
    };

    const subject = subjects[language] || subjects.pt;
    const html = bodies[language] || bodies.pt;

    const result = await client.emails.send({
      from: fromEmail || 'ModelHero <noreply@modelhero.app>',
      to: toEmail,
      subject,
      html
    });

    console.log('[Resend] Follow-up 4d email sent to:', toEmail, 'language:', language, result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Resend] Failed to send follow-up 4d email:', error);
    return { success: false, error };
  }
}

export async function sendFollowUp10dEmail(toEmail: string, language: string = 'pt') {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const loginUrl = 'https://modelhero.replit.app/login';
    const appUrl = 'https://modelhero.replit.app/';
    const buttonStyles = 'display: inline-block; background-color: #3E5641; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;';
    
    const subjects: Record<string, string> = {
      pt: 'Sem pressa :)',
      en: 'No rush :)',
      es: 'Sin prisa :)',
      fr: 'Pas de pression :)',
      de: 'Keine Eile :)',
      it: 'Senza fretta :)',
      ru: 'Не торопитесь :)',
      ja: '急がなくて大丈夫です :)'
    };

    const bodies: Record<string, string> = {
      pt: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Oi,</p>
          <p>Só passando para dizer uma coisa simples: sem pressa.</p>
          <p>O ModelHero está aqui para quando você quiser organizar seu hobby — no seu tempo, do seu jeito.</p>
          <p>Tem gente que começa no mesmo dia.<br>
          Outros só voltam depois de semanas.<br>
          Está tudo bem.</p>
          <p>Quando fizer sentido, é só entrar e cadastrar um kit.<br>
          Nada mais.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Acessar minha conta</a>
          </p>
          <p>Até quando precisar,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hi,</p>
          <p>Just stopping by to say something simple: no rush.</p>
          <p>ModelHero is here for when you want to organize your hobby — at your own pace, in your own way.</p>
          <p>Some people start on the same day.<br>
          Others only come back after weeks.<br>
          That's perfectly fine.</p>
          <p>When it makes sense, just log in and add a kit.<br>
          Nothing more.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Access my account</a>
          </p>
          <p>Until you need me,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      es: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hola,</p>
          <p>Solo paso para decir algo simple: sin prisa.</p>
          <p>ModelHero está aquí para cuando quieras organizar tu hobby — a tu ritmo, a tu manera.</p>
          <p>Algunos empiezan el mismo día.<br>
          Otros solo vuelven después de semanas.<br>
          Está perfectamente bien.</p>
          <p>Cuando tenga sentido, solo entra y añade un kit.<br>
          Nada más.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Acceder a mi cuenta</a>
          </p>
          <p>Hasta cuando lo necesites,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      fr: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Bonjour,</p>
          <p>Je passe juste pour vous dire quelque chose de simple : pas de pression.</p>
          <p>ModelHero est là pour quand vous voudrez organiser votre hobby — à votre rythme, à votre façon.</p>
          <p>Certains commencent le jour même.<br>
          D'autres ne reviennent qu'après des semaines.<br>
          C'est tout à fait normal.</p>
          <p>Quand ce sera le bon moment, connectez-vous et ajoutez un kit.<br>
          Rien de plus.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Accéder à mon compte</a>
          </p>
          <p>À bientôt,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      de: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hallo,</p>
          <p>Ich wollte nur kurz etwas Einfaches sagen: Keine Eile.</p>
          <p>ModelHero ist da, wenn du dein Hobby organisieren möchtest — in deinem Tempo, auf deine Art.</p>
          <p>Manche fangen am selben Tag an.<br>
          Andere kommen erst nach Wochen zurück.<br>
          Das ist völlig in Ordnung.</p>
          <p>Wenn es soweit ist, logge dich einfach ein und füge ein Kit hinzu.<br>
          Mehr nicht.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Auf mein Konto zugreifen</a>
          </p>
          <p>Bis bald,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      it: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Ciao,</p>
          <p>Passo solo per dirti una cosa semplice: senza fretta.</p>
          <p>ModelHero è qui per quando vorrai organizzare il tuo hobby — con i tuoi tempi, a modo tuo.</p>
          <p>Alcuni iniziano lo stesso giorno.<br>
          Altri tornano solo dopo settimane.<br>
          Va benissimo così.</p>
          <p>Quando sarà il momento giusto, accedi e aggiungi un kit.<br>
          Nient'altro.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Accedi al mio account</a>
          </p>
          <p>A presto,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      ru: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Привет,</p>
          <p>Просто хотел сказать кое-что простое: не торопитесь.</p>
          <p>ModelHero будет здесь, когда вы захотите организовать своё хобби — в вашем темпе, по-вашему.</p>
          <p>Кто-то начинает в тот же день.<br>
          Другие возвращаются только через несколько недель.<br>
          И это совершенно нормально.</p>
          <p>Когда будет подходящий момент, просто войдите и добавьте набор.<br>
          Больше ничего.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Войти в мой аккаунт</a>
          </p>
          <p>До встречи,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      ja: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>こんにちは、</p>
          <p>シンプルなことをお伝えしたくて：急ぐ必要はありません。</p>
          <p>ModelHeroは、あなたが趣味を整理したくなったときのためにここにあります — あなたのペースで、あなたのやり方で。</p>
          <p>その日のうちに始める方もいます。<br>
          数週間後に戻ってくる方もいます。<br>
          どちらでも全く問題ありません。</p>
          <p>タイミングが合ったら、ログインしてキットを追加するだけです。<br>
          それだけです。</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">マイアカウントにアクセス</a>
          </p>
          <p>またいつでも、<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `
    };

    const subject = subjects[language] || subjects.pt;
    const html = bodies[language] || bodies.pt;

    const result = await client.emails.send({
      from: fromEmail || 'ModelHero <noreply@modelhero.app>',
      to: toEmail,
      subject,
      html
    });

    console.log('[Resend] Follow-up 10d email sent to:', toEmail, 'language:', language, result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Resend] Failed to send follow-up 10d email:', error);
    return { success: false, error };
  }
}

export async function sendLimitReachedEmail(toEmail: string, language: string = 'pt') {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const kiwifyUrl = 'https://pay.kiwify.com.br/3lfpi2F';
    const stripeUrl = 'https://modelhero.replit.app/pricing';
    const appUrl = 'https://modelhero.replit.app/';
    const buttonStyles = 'display: inline-block; background-color: #3E5641; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;';
    
    const upgradeUrl = language === 'pt' ? kiwifyUrl : stripeUrl;

    const subjects: Record<string, string> = {
      pt: 'Seu ModelHero está crescendo com você',
      en: 'Your ModelHero is growing with you',
      es: 'Tu ModelHero está creciendo contigo',
      fr: 'Votre ModelHero grandit avec vous',
      de: 'Dein ModelHero wächst mit dir',
      it: 'Il tuo ModelHero cresce con te',
      ru: 'Ваш ModelHero растёт вместе с вами',
      ja: 'あなたのModelHeroが成長しています'
    };

    const bodies: Record<string, string> = {
      pt: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Oi,</p>
          <p>Você acabou de atingir o limite do plano gratuito do ModelHero.<br>
          Isso normalmente acontece quando a ferramenta começa a fazer sentido de verdade.</p>
          <p>Até aqui, você já conseguiu:</p>
          <ul>
            <li>organizar seus primeiros kits e itens</li>
            <li>ter uma visão mais clara do que tem</li>
            <li>começar a tirar a bagunça da cabeça</li>
          </ul>
          <p>A partir de agora, para continuar cadastrando novos itens e usar o ModelHero sem limites, é preciso fazer o upgrade para o plano completo.</p>
          <p>O plano pago libera:</p>
          <ul>
            <li>cadastro ilimitado de kits e materiais</li>
            <li>uso completo das funcionalidades</li>
            <li>a evolução contínua da ferramenta</li>
          </ul>
          <p>Se fizer sentido para você seguir organizando tudo em um só lugar, o upgrade está disponível a qualquer momento.</p>
          <p style="text-align: center;">
            <a href="${upgradeUrl}" style="${buttonStyles}">Ver plano completo e continuar</a>
          </p>
          <p>E se agora não for a hora, sem problema.<br>
          O que você já cadastrou continua salvo.</p>
          <p>Abraço,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hi,</p>
          <p>You've just reached the limit of ModelHero's free plan.<br>
          This usually happens when the tool starts to really make sense.</p>
          <p>So far, you've already managed to:</p>
          <ul>
            <li>organize your first kits and items</li>
            <li>get a clearer view of what you have</li>
            <li>start clearing the clutter from your head</li>
          </ul>
          <p>From now on, to keep adding new items and use ModelHero without limits, you'll need to upgrade to the full plan.</p>
          <p>The paid plan unlocks:</p>
          <ul>
            <li>unlimited kit and material registration</li>
            <li>full access to all features</li>
            <li>continuous tool evolution</li>
          </ul>
          <p>If it makes sense for you to keep organizing everything in one place, the upgrade is available anytime.</p>
          <p style="text-align: center;">
            <a href="${upgradeUrl}" style="${buttonStyles}">See full plan and continue</a>
          </p>
          <p>And if now is not the right time, no problem.<br>
          What you've already registered stays saved.</p>
          <p>Best,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      es: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hola,</p>
          <p>Acabas de alcanzar el límite del plan gratuito de ModelHero.<br>
          Esto normalmente sucede cuando la herramienta empieza a tener sentido de verdad.</p>
          <p>Hasta aquí, ya has conseguido:</p>
          <ul>
            <li>organizar tus primeros kits y artículos</li>
            <li>tener una visión más clara de lo que tienes</li>
            <li>empezar a quitar el desorden de tu cabeza</li>
          </ul>
          <p>A partir de ahora, para seguir añadiendo nuevos artículos y usar ModelHero sin límites, necesitas actualizar al plan completo.</p>
          <p>El plan de pago desbloquea:</p>
          <ul>
            <li>registro ilimitado de kits y materiales</li>
            <li>acceso completo a todas las funcionalidades</li>
            <li>evolución continua de la herramienta</li>
          </ul>
          <p>Si tiene sentido para ti seguir organizando todo en un solo lugar, la actualización está disponible en cualquier momento.</p>
          <p style="text-align: center;">
            <a href="${upgradeUrl}" style="${buttonStyles}">Ver plan completo y continuar</a>
          </p>
          <p>Y si ahora no es el momento, no hay problema.<br>
          Lo que ya has registrado sigue guardado.</p>
          <p>Saludos,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      fr: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Bonjour,</p>
          <p>Vous venez d'atteindre la limite du plan gratuit de ModelHero.<br>
          Cela arrive généralement quand l'outil commence à vraiment faire sens.</p>
          <p>Jusqu'ici, vous avez déjà réussi à :</p>
          <ul>
            <li>organiser vos premiers kits et articles</li>
            <li>avoir une vision plus claire de ce que vous possédez</li>
            <li>commencer à libérer votre esprit du désordre</li>
          </ul>
          <p>À partir de maintenant, pour continuer à ajouter de nouveaux articles et utiliser ModelHero sans limites, il faut passer au plan complet.</p>
          <p>Le plan payant débloque :</p>
          <ul>
            <li>l'enregistrement illimité de kits et matériaux</li>
            <li>l'accès complet à toutes les fonctionnalités</li>
            <li>l'évolution continue de l'outil</li>
          </ul>
          <p>Si ça a du sens pour vous de continuer à tout organiser au même endroit, la mise à niveau est disponible à tout moment.</p>
          <p style="text-align: center;">
            <a href="${upgradeUrl}" style="${buttonStyles}">Voir le plan complet et continuer</a>
          </p>
          <p>Et si ce n'est pas le bon moment, pas de souci.<br>
          Ce que vous avez déjà enregistré reste sauvegardé.</p>
          <p>Cordialement,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      de: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hallo,</p>
          <p>Du hast gerade das Limit des kostenlosen ModelHero-Plans erreicht.<br>
          Das passiert normalerweise, wenn das Tool anfängt, wirklich Sinn zu machen.</p>
          <p>Bis hierhin hast du bereits geschafft:</p>
          <ul>
            <li>deine ersten Kits und Artikel zu organisieren</li>
            <li>einen klareren Überblick über deinen Bestand zu bekommen</li>
            <li>angefangen, Ordnung im Kopf zu schaffen</li>
          </ul>
          <p>Um weiterhin neue Artikel hinzuzufügen und ModelHero ohne Einschränkungen zu nutzen, ist ein Upgrade auf den vollen Plan nötig.</p>
          <p>Der kostenpflichtige Plan bietet:</p>
          <ul>
            <li>unbegrenzte Registrierung von Kits und Materialien</li>
            <li>vollen Zugang zu allen Funktionen</li>
            <li>kontinuierliche Weiterentwicklung des Tools</li>
          </ul>
          <p>Wenn es für dich Sinn macht, alles an einem Ort zu organisieren, steht das Upgrade jederzeit bereit.</p>
          <p style="text-align: center;">
            <a href="${upgradeUrl}" style="${buttonStyles}">Vollen Plan ansehen und weitermachen</a>
          </p>
          <p>Und wenn jetzt nicht der richtige Zeitpunkt ist, kein Problem.<br>
          Was du bereits registriert hast, bleibt gespeichert.</p>
          <p>Viele Grüße,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      it: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Ciao,</p>
          <p>Hai appena raggiunto il limite del piano gratuito di ModelHero.<br>
          Questo di solito succede quando lo strumento inizia davvero ad avere senso.</p>
          <p>Finora, sei già riuscito a:</p>
          <ul>
            <li>organizzare i tuoi primi kit e articoli</li>
            <li>avere una visione più chiara di ciò che possiedi</li>
            <li>iniziare a liberare la mente dal disordine</li>
          </ul>
          <p>Da ora in poi, per continuare ad aggiungere nuovi articoli e usare ModelHero senza limiti, è necessario passare al piano completo.</p>
          <p>Il piano a pagamento sblocca:</p>
          <ul>
            <li>registrazione illimitata di kit e materiali</li>
            <li>accesso completo a tutte le funzionalità</li>
            <li>evoluzione continua dello strumento</li>
          </ul>
          <p>Se ha senso per te continuare a organizzare tutto in un unico posto, l'upgrade è disponibile in qualsiasi momento.</p>
          <p style="text-align: center;">
            <a href="${upgradeUrl}" style="${buttonStyles}">Vedi il piano completo e continua</a>
          </p>
          <p>E se ora non è il momento giusto, nessun problema.<br>
          Quello che hai già registrato resta salvato.</p>
          <p>Cordiali saluti,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      ru: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Привет,</p>
          <p>Вы только что достигли лимита бесплатного плана ModelHero.<br>
          Обычно это происходит, когда инструмент начинает по-настоящему помогать.</p>
          <p>До сих пор вы уже смогли:</p>
          <ul>
            <li>организовать свои первые наборы и предметы</li>
            <li>получить более чёткое представление о том, что у вас есть</li>
            <li>начать наводить порядок в голове</li>
          </ul>
          <p>Чтобы продолжать добавлять новые предметы и использовать ModelHero без ограничений, необходимо перейти на полный план.</p>
          <p>Платный план открывает:</p>
          <ul>
            <li>неограниченную регистрацию наборов и материалов</li>
            <li>полный доступ ко всем функциям</li>
            <li>постоянное развитие инструмента</li>
          </ul>
          <p>Если для вас имеет смысл продолжать организовывать всё в одном месте, переход на полный план доступен в любой момент.</p>
          <p style="text-align: center;">
            <a href="${upgradeUrl}" style="${buttonStyles}">Посмотреть полный план и продолжить</a>
          </p>
          <p>А если сейчас не подходящий момент, ничего страшного.<br>
          Всё, что вы уже зарегистрировали, сохранено.</p>
          <p>С уважением,<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      ja: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>こんにちは、</p>
          <p>ModelHeroの無料プランの上限に達しました。<br>
          これは通常、ツールが本当に役立ち始めたときに起こります。</p>
          <p>ここまでで、すでにこんなことができました：</p>
          <ul>
            <li>最初のキットやアイテムを整理する</li>
            <li>持っているものをより明確に把握する</li>
            <li>頭の中の散らかりを整理し始める</li>
          </ul>
          <p>これからも新しいアイテムを追加し、ModelHeroを制限なく使い続けるには、フルプランへのアップグレードが必要です。</p>
          <p>有料プランでは以下が利用可能になります：</p>
          <ul>
            <li>キットと素材の無制限登録</li>
            <li>すべての機能へのフルアクセス</li>
            <li>ツールの継続的な進化</li>
          </ul>
          <p>すべてを一か所で整理し続けることに意味を感じるなら、アップグレードはいつでも可能です。</p>
          <p style="text-align: center;">
            <a href="${upgradeUrl}" style="${buttonStyles}">フルプランを見て続ける</a>
          </p>
          <p>もし今がそのタイミングでなくても、問題ありません。<br>
          すでに登録したものはそのまま保存されています。</p>
          <p>よろしくお願いします、<br>
          Marcelo<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `
    };

    const subject = subjects[language] || subjects.pt;
    const html = bodies[language] || bodies.pt;

    const result = await client.emails.send({
      from: fromEmail || 'ModelHero <noreply@modelhero.app>',
      to: toEmail,
      subject,
      html
    });

    console.log('[Resend] Limit reached email sent to:', toEmail, 'language:', language, result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Resend] Failed to send limit reached email:', error);
    return { success: false, error };
  }
}

// E-mails de correção com pedido de desculpas (para reenvio em espanhol)
export async function sendCorrectionEmail24h(toEmail: string) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const appUrl = 'https://modelhero.replit.app/';
    const loginUrl = 'https://modelhero.replit.app/login';
    const buttonStyles = 'display: inline-block; background-color: #3E5641; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;';
    
    const subject = 'Tu primer kit en ModelHero tarda menos de 1 minuto';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <p style="background-color: #FFF3CD; border: 1px solid #FFEEBA; padding: 12px; border-radius: 6px; color: #856404;">
          <strong>Nota:</strong> Disculpa, nuestro sistema de emails estaba mal configurado y el mensaje anterior fue enviado en portugués por error. Ahora está corregido. Aquí tienes el contenido correcto:
        </p>
        <p>Hola,</p>
        <p>Ayer creaste tu cuenta en ModelHero — bienvenido :)</p>
        <p>Mucha gente se detiene ahí no por falta de interés, sino porque piensa que va a ser mucho trabajo empezar.<br>
        La buena noticia es que no tienes que parar, y no, no es difícil.</p>
        <p>La mayoría de los usuarios comienzan añadiendo solo un kit.<br>
        Eso es suficiente para entender cómo funciona todo y empezar a organizar tu hobby.</p>
        <p>Puedes:</p>
        <ul>
          <li>completar solo lo básico</li>
          <li>usar un enlace del kit para agilizar</li>
          <li>o editar y ajustar después, sin prisa</li>
        </ul>
        <p style="text-align: center;">
          <a href="${loginUrl}" style="${buttonStyles}">Añadir mi primer kit</a>
        </p>
        <p>Cuando quieras, ModelHero está aquí para ayudarte a mantener todo en su lugar.</p>
        <p>Saludos,<br>
        Marcelo<br>
        <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
      </div>
    `;

    const result = await client.emails.send({
      from: fromEmail || 'ModelHero <noreply@modelhero.app>',
      to: toEmail,
      subject,
      html
    });

    console.log('[Resend] Correction 24h email sent to:', toEmail, result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Resend] Failed to send correction 24h email:', error);
    return { success: false, error };
  }
}

export async function sendCorrectionEmail4d(toEmail: string) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const appUrl = 'https://modelhero.replit.app/';
    const loginUrl = 'https://modelhero.replit.app/login';
    const buttonStyles = 'display: inline-block; background-color: #3E5641; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;';
    
    const subject = 'Cómo uso ModelHero en mi propio hobby';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <p style="background-color: #FFF3CD; border: 1px solid #FFEEBA; padding: 12px; border-radius: 6px; color: #856404;">
          <strong>Nota:</strong> Disculpa, nuestro sistema de emails estaba mal configurado y el mensaje anterior fue enviado en portugués por error. Ahora está corregido. Aquí tienes el contenido correcto:
        </p>
        <p>Hola,</p>
        <p>Quería contarte rápidamente cómo uso ModelHero en mi día a día como maquetista.</p>
        <p>Siempre empiezo por lo básico: añado solo un kit.<br>
        Sin pensar en organizar todo de una vez.</p>
        <p>Después de eso, es fácil:</p>
        <ul>
          <li>ver lo que ya tengo</li>
          <li>saber qué está en progreso</li>
          <li>evitar compras duplicadas</li>
          <li>tener una noción real de mi stash</li>
        </ul>
        <p>ModelHero no es sobre control excesivo — es sobre quitar el desorden de tu cabeza y hacer el hobby más ligero.</p>
        <p>Si tiene sentido para ti, empieza con tu primer kit.<br>
        Así es como todo comienza aquí.</p>
        <p style="text-align: center;">
          <a href="${loginUrl}" style="${buttonStyles}">Añadir mi primer kit</a>
        </p>
        <p>Saludos,<br>
        Marcelo<br>
        <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
      </div>
    `;

    const result = await client.emails.send({
      from: fromEmail || 'ModelHero <noreply@modelhero.app>',
      to: toEmail,
      subject,
      html
    });

    console.log('[Resend] Correction 4d email sent to:', toEmail, result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Resend] Failed to send correction 4d email:', error);
    return { success: false, error };
  }
}

export async function sendCorrectionEmail10d(toEmail: string) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const appUrl = 'https://modelhero.replit.app/';
    const loginUrl = 'https://modelhero.replit.app/login';
    const buttonStyles = 'display: inline-block; background-color: #3E5641; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;';
    
    const subject = 'Sin prisa :)';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <p style="background-color: #FFF3CD; border: 1px solid #FFEEBA; padding: 12px; border-radius: 6px; color: #856404;">
          <strong>Nota:</strong> Disculpa, nuestro sistema de emails estaba mal configurado y el mensaje anterior fue enviado en portugués por error. Ahora está corregido. Aquí tienes el contenido correcto:
        </p>
        <p>Hola,</p>
        <p>Solo pasaba para decirte algo simple: sin prisa.</p>
        <p>ModelHero está aquí para cuando quieras organizar tu hobby — a tu ritmo, a tu manera.</p>
        <p>Hay gente que empieza el mismo día.<br>
        Otros solo vuelven después de semanas.<br>
        Está todo bien.</p>
        <p>Cuando tenga sentido, simplemente entra y añade un kit.<br>
        Nada más.</p>
        <p style="text-align: center;">
          <a href="${loginUrl}" style="${buttonStyles}">Acceder a mi cuenta</a>
        </p>
        <p>Hasta cuando lo necesites,<br>
        Marcelo<br>
        <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
      </div>
    `;

    const result = await client.emails.send({
      from: fromEmail || 'ModelHero <noreply@modelhero.app>',
      to: toEmail,
      subject,
      html
    });

    console.log('[Resend] Correction 10d email sent to:', toEmail, result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Resend] Failed to send correction 10d email:', error);
    return { success: false, error };
  }
}

export async function sendFollowUp30dInactiveEmail(toEmail: string, userName: string, language: string = 'pt') {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const loginUrl = 'https://modelhero.replit.app/login';
    const appUrl = 'https://modelhero.replit.app/';
    const buttonStyles = 'display: inline-block; background-color: #3E5641; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;';
    const firstName = userName?.split(' ')[0] || '';

    const subjects: Record<string, string> = {
      pt: 'Sentimos sua falta no ModelHero',
      en: 'We miss you at ModelHero',
      es: 'Te extrañamos en ModelHero',
      fr: 'Vous nous manquez sur ModelHero',
      de: 'Wir vermissen dich bei ModelHero',
      it: 'Ci manchi su ModelHero',
      ru: 'Мы скучаем по вам в ModelHero',
      ja: 'ModelHeroでお待ちしています'
    };

    const bodies: Record<string, string> = {
      pt: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Olá ${firstName},</p>
          <p>Sentimos sua falta no Model Hero 😊</p>
          <p>Percebemos que você não acessa o app há 30 dias, e sua bancada pode estar precisando de uma atualização.</p>
          <p>Você pode:</p>
          <ul>
            <li>Cadastrar novos kits que chegaram à sua coleção</li>
            <li>Atualizar o andamento das montagens atuais</li>
            <li>Manter valores, horas e status sempre organizados</li>
            <li>Visualizar sua evolução como plastimodelista em um só lugar</li>
          </ul>
          <p>Manter seus kits atualizados ajuda você a ter mais controle da bancada e aproveitar melhor cada projeto.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Voltar para o Model Hero agora</a>
          </p>
          <p>Sua bancada organizada.<br>
          Suas montagens sob controle.<br>
          Seu hobby do jeito certo.</p>
          <p>Até já,<br>
          Equipe Model Hero<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hi ${firstName},</p>
          <p>We miss you at Model Hero 😊</p>
          <p>We noticed you haven't accessed the app in 30 days, and your workbench might need an update.</p>
          <p>You can:</p>
          <ul>
            <li>Register new kits that have arrived in your collection</li>
            <li>Update the progress on your current builds</li>
            <li>Keep values, hours, and status always organized</li>
            <li>View your evolution as a scale modeler in one place</li>
          </ul>
          <p>Keeping your kits up to date helps you stay in control of your workbench and make the most of every project.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Go back to Model Hero now</a>
          </p>
          <p>Your workbench organized.<br>
          Your builds under control.<br>
          Your hobby done right.</p>
          <p>See you soon,<br>
          Model Hero Team<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      es: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hola ${firstName},</p>
          <p>Te extrañamos en Model Hero 😊</p>
          <p>Notamos que no accedes a la app hace 30 días, y tu banco de trabajo puede necesitar una actualización.</p>
          <p>Puedes:</p>
          <ul>
            <li>Registrar nuevos kits que llegaron a tu colección</li>
            <li>Actualizar el avance de tus montajes actuales</li>
            <li>Mantener valores, horas y estados siempre organizados</li>
            <li>Visualizar tu evolución como maquetista en un solo lugar</li>
          </ul>
          <p>Mantener tus kits actualizados te ayuda a tener más control del banco de trabajo y aprovechar mejor cada proyecto.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Volver a Model Hero ahora</a>
          </p>
          <p>Tu banco de trabajo organizado.<br>
          Tus montajes bajo control.<br>
          Tu hobby como debe ser.</p>
          <p>Hasta pronto,<br>
          Equipo Model Hero<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      fr: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Bonjour ${firstName},</p>
          <p>Vous nous manquez sur Model Hero 😊</p>
          <p>Nous avons remarqué que vous n'avez pas accédé à l'application depuis 30 jours, et votre atelier a peut-être besoin d'une mise à jour.</p>
          <p>Vous pouvez :</p>
          <ul>
            <li>Enregistrer les nouveaux kits arrivés dans votre collection</li>
            <li>Mettre à jour l'avancement de vos montages en cours</li>
            <li>Garder vos valeurs, heures et statuts toujours organisés</li>
            <li>Visualiser votre évolution en tant que maquettiste en un seul endroit</li>
          </ul>
          <p>Garder vos kits à jour vous aide à mieux contrôler votre atelier et à tirer le meilleur de chaque projet.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Revenir sur Model Hero maintenant</a>
          </p>
          <p>Votre atelier organisé.<br>
          Vos montages sous contrôle.<br>
          Votre hobby comme il se doit.</p>
          <p>À bientôt,<br>
          L'équipe Model Hero<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      de: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Hallo ${firstName},</p>
          <p>Wir vermissen dich bei Model Hero 😊</p>
          <p>Uns ist aufgefallen, dass du seit 30 Tagen nicht mehr auf die App zugegriffen hast, und deine Werkbank könnte ein Update vertragen.</p>
          <p>Du kannst:</p>
          <ul>
            <li>Neue Kits registrieren, die zu deiner Sammlung dazugekommen sind</li>
            <li>Den Fortschritt deiner aktuellen Bauprojekte aktualisieren</li>
            <li>Werte, Stunden und Status immer organisiert halten</li>
            <li>Deine Entwicklung als Modellbauer an einem Ort verfolgen</li>
          </ul>
          <p>Deine Kits aktuell zu halten hilft dir, deine Werkbank besser im Griff zu haben und jedes Projekt optimal zu nutzen.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Jetzt zu Model Hero zurückkehren</a>
          </p>
          <p>Deine Werkbank organisiert.<br>
          Deine Bauprojekte unter Kontrolle.<br>
          Dein Hobby richtig gemacht.</p>
          <p>Bis bald,<br>
          Team Model Hero<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      it: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Ciao ${firstName},</p>
          <p>Ci manchi su Model Hero 😊</p>
          <p>Abbiamo notato che non accedi all'app da 30 giorni, e il tuo banco di lavoro potrebbe aver bisogno di un aggiornamento.</p>
          <p>Puoi:</p>
          <ul>
            <li>Registrare nuovi kit arrivati nella tua collezione</li>
            <li>Aggiornare l'avanzamento dei tuoi montaggi attuali</li>
            <li>Mantenere valori, ore e stato sempre organizzati</li>
            <li>Visualizzare la tua evoluzione come modellista in un unico posto</li>
          </ul>
          <p>Mantenere i tuoi kit aggiornati ti aiuta ad avere più controllo sul banco di lavoro e a sfruttare al meglio ogni progetto.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Torna su Model Hero ora</a>
          </p>
          <p>Il tuo banco di lavoro organizzato.<br>
          I tuoi montaggi sotto controllo.<br>
          Il tuo hobby fatto bene.</p>
          <p>A presto,<br>
          Team Model Hero<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      ru: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>Привет, ${firstName}!</p>
          <p>Мы скучаем по вам в Model Hero 😊</p>
          <p>Мы заметили, что вы не заходили в приложение уже 30 дней, и ваш рабочий стол может нуждаться в обновлении.</p>
          <p>Вы можете:</p>
          <ul>
            <li>Зарегистрировать новые наборы, пополнившие вашу коллекцию</li>
            <li>Обновить ход текущих сборок</li>
            <li>Поддерживать стоимости, часы и статусы всегда в порядке</li>
            <li>Отслеживать свой прогресс как моделиста в одном месте</li>
          </ul>
          <p>Поддержание актуальности наборов помогает лучше контролировать рабочий стол и извлекать максимум из каждого проекта.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">Вернуться в Model Hero сейчас</a>
          </p>
          <p>Ваш рабочий стол в порядке.<br>
          Ваши сборки под контролем.<br>
          Ваше хобби — как надо.</p>
          <p>До скорой встречи,<br>
          Команда Model Hero<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `,
      ja: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <p>${firstName}さん、こんにちは。</p>
          <p>Model Heroでお待ちしています 😊</p>
          <p>30日間アプリにアクセスされていないようです。ワークベンチの更新が必要かもしれません。</p>
          <p>できること：</p>
          <ul>
            <li>コレクションに加わった新しいキットを登録する</li>
            <li>現在の組み立て進捗を更新する</li>
            <li>金額、時間、ステータスを常に整理しておく</li>
            <li>モデラーとしての成長を一か所で確認する</li>
          </ul>
          <p>キットを最新の状態に保つことで、ワークベンチをよりうまく管理し、各プロジェクトを最大限に活かせます。</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" style="${buttonStyles}">今すぐModel Heroに戻る</a>
          </p>
          <p>整理されたワークベンチ。<br>
          管理された組み立て。<br>
          正しいホビーの楽しみ方。</p>
          <p>またお会いしましょう、<br>
          Model Heroチーム<br>
          <a href="${appUrl}" style="color: #3E5641;">ModelHero</a></p>
        </div>
      `
    };

    const subject = subjects[language] || subjects['pt'];
    const html = bodies[language] || bodies['pt'];

    const result = await client.emails.send({
      from: fromEmail || 'ModelHero <noreply@modelhero.app>',
      to: toEmail,
      subject,
      html
    });

    console.log('[Resend] Follow-up 30d inactive email sent to:', toEmail, 'language:', language, result);
    return { success: true, data: result };
  } catch (error) {
    console.error('[Resend] Failed to send follow-up 30d inactive email:', error);
    return { success: false, error };
  }
}

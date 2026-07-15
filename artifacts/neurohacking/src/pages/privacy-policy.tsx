import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.28 }}
      className="min-h-[100dvh]"
    >
      {/* Back Button */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center px-4"
        style={{
          height: 52,
          background: 'rgba(12,24,40,0.92)',
          borderBottom: '1px solid rgba(100,160,230,0.1)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <button
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else setLocation('/');
          }}
          className="flex items-center gap-1 text-primary active:opacity-60 transition-opacity"
        >
          <ChevronLeft size={24} />
          <span className="body-s">Назад</span>
        </button>
      </div>

      {/* Content */}
      <div className="pt-[68px] px-5 pb-16 max-w-[600px] mx-auto">
        <h1 className="title-l text-primary mb-2">Политика конфиденциальности</h1>
        <p className="caption text-tertiary mb-8">Дата вступления в силу: 05.06.26</p>

        <div className="space-y-6 body-s text-secondary leading-relaxed">
          <p>
            Приложение «Нейрохакинг» уважает право пользователей на конфиденциальность и
            обеспечивает защиту предоставляемых персональных данных.
          </p>

          <section>
            <h2 className="title-s text-primary mb-2">1. Какие данные собираются</h2>
            <p>
              Приложение собирает только адрес электронной почты, который пользователь
              добровольно указывает через форму подписки.
            </p>
          </section>

          <section>
            <h2 className="title-s text-primary mb-2">2. Для чего используются данные</h2>
            <p className="mb-2">Адрес электронной почты используется исключительно для:</p>
            <ul className="space-y-1 ml-4 list-none">
              <li>— отправки уведомлений о новых статьях Академии;</li>
              <li>— информирования об обновлениях приложения;</li>
              <li>— отправки новостей и важных уведомлений проекта.</li>
            </ul>
          </section>

          <section>
            <h2 className="title-s text-primary mb-2">3. Правовые основания обработки</h2>
            <p>
              Обработка персональных данных осуществляется на основании согласия пользователя
              в соответствии с Федеральным законом Российской Федерации № 152-ФЗ «О персональных данных».
            </p>
          </section>

          <section>
            <h2 className="title-s text-primary mb-2">4. Хранение и удаление данных</h2>
            <p>
              Адрес электронной почты хранится до момента отзыва согласия пользователем либо
              прекращения работы сервиса.
            </p>
            <p className="mt-2">
              Пользователь вправе в любой момент запросить удаление своих данных, направив
              обращение на электронную почту:{' '}
              <span className="text-blue-light">tataerisgreyrat@gmail.com</span>
            </p>
          </section>

          <section>
            <h2 className="title-s text-primary mb-2">5. Передача данных третьим лицам</h2>
            <p>
              Персональные данные пользователей не продаются и не передаются третьим лицам,
              за исключением случаев, предусмотренных действующим законодательством
              Российской Федерации.
            </p>
          </section>

          <section>
            <h2 className="title-s text-primary mb-2">6. Безопасность данных</h2>
            <p>
              Администрация приложения принимает разумные организационные и технические меры
              для защиты персональных данных от неправомерного доступа, изменения, раскрытия
              или уничтожения.
            </p>
          </section>

          <section>
            <h2 className="title-s text-primary mb-2">7. Контакты</h2>
            <p>
              По вопросам обработки персональных данных пользователь может обратиться по
              адресу электронной почты:{' '}
              <span className="text-blue-light">tataerisgreyrat@gmail.com</span>
            </p>
          </section>

          <section>
            <h2 className="title-s text-primary mb-2">8. Изменение политики</h2>
            <p>
              Администрация приложения вправе вносить изменения в настоящую Политику
              конфиденциальности. Актуальная версия документа всегда доступна в приложении.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

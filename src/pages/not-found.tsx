export default function NotFound() {
  return (
    <div className="flex flex-col h-[100dvh] items-center justify-center bg-base px-6 text-center">
      <div style={{ fontSize: 48 }} className="mb-6">404</div>
      <h1 className="title-l text-primary mb-2">Страница не найдена</h1>
      <p className="body-s text-secondary mb-8">Такой страницы не существует</p>
      <button
        onClick={() => { window.location.href = '/'; }}
        className="h-[48px] px-8 rounded-[14px] bg-blue-core text-white title-s active:opacity-90"
      >
        Главная
      </button>
    </div>
  );
}

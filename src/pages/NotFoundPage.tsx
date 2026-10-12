import { Empty } from '../components/UI';
export function NotFoundPage() {
  return (
    <div className="page-shell container">
      <Empty
        title="404 — здесь пока тишина"
        text="Такой страницы нет. Вернитесь на главную и найдите свою команду."
        to="/"
        action="На главную"
      />
    </div>
  );
}

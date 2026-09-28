export function Card({ title, subtitle, action, children, className = "", ...rest }) {
  return (
    <section className={`card ${className}`} {...rest}>
      {(title || action) && (
        <header className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}

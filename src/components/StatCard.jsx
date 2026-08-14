export default function StatCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="stat-card">

      <div className="stat-card-content">
        <p className="stat-title">
          {title}
        </p>

        <h2 className="stat-value">
          {value}
        </h2>
      </div>

      <div className="stat-icon">
        {Icon && <Icon size={28} />}
      </div>

    </div>
  );
}
/**
 * Skeleton — Premium loading state components.
 * Replace generic spinners with contextual skeleton loaders.
 */

import "./Skeleton.css";

export function SkeletonCard({ count = 1, style }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="skel-card" style={style}>
      <div className="skel-card-header">
        <div className="skeleton skeleton-avatar" />
        <div className="skel-card-lines">
          <div className="skeleton skeleton-text medium" />
          <div className="skeleton skeleton-text short" />
        </div>
      </div>
      <div className="skeleton skeleton-text long" />
      <div className="skeleton skeleton-text medium" />
      <div className="skel-card-tags">
        <div className="skeleton skel-tag" />
        <div className="skeleton skel-tag" />
        <div className="skeleton skel-tag" />
      </div>
    </div>
  ));
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="skel-table">
      <div className="skel-table-header">
        <div className="skeleton skeleton-text medium" />
        <div className="skeleton skeleton-text short" />
        <div className="skeleton skeleton-text short" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skel-table-row" style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="skeleton skeleton-text medium" />
          <div className="skeleton skeleton-text short" />
          <div className="skeleton skeleton-text short" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStat({ count = 4 }) {
  return (
    <div className="skel-stats-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skel-stat-card" style={{ animationDelay: `${i * 0.08}s` }}>
          <div className="skeleton skel-stat-icon" />
          <div className="skeleton skeleton-text short" style={{ height: "28px" }} />
          <div className="skeleton skeleton-text medium" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="skel-profile">
      <div className="skel-profile-header">
        <div className="skeleton skel-profile-avatar" />
        <div className="skel-profile-info">
          <div className="skeleton skeleton-text medium" style={{ height: "20px" }} />
          <div className="skeleton skeleton-text short" />
          <div className="skeleton skeleton-text long" />
        </div>
      </div>
      <div className="skel-profile-body">
        <div className="skeleton skeleton-text long" />
        <div className="skeleton skeleton-text long" />
        <div className="skeleton skeleton-text medium" />
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="page-container">
      <div className="skel-page-header">
        <div className="skeleton skeleton-text medium" style={{ height: "32px", width: "300px" }} />
        <div className="skeleton skeleton-text long" style={{ maxWidth: "500px" }} />
      </div>
      <SkeletonStat />
      <div style={{ marginTop: "32px" }}>
        <SkeletonCard count={3} />
      </div>
    </div>
  );
}

export default SkeletonCard;

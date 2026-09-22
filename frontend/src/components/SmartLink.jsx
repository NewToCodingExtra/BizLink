import { Link, useLocation } from "react-router-dom";

export default function SmartLink({ to, onClick, children, ...rest }) {
  const { pathname } = useLocation();

  const handleClick = (e) => {
    if (typeof to === "string" && !to.includes("?") && to === pathname) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (onClick) onClick(e);
  };

  return (
    <Link to={to} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}

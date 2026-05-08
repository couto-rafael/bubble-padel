import React from "react";
import { Link } from "react-router-dom";

interface AthleteNameProps {
  id?: string | null;
  name: string;
  className?: string;
}

const AthleteName: React.FC<AthleteNameProps> = ({ id, name, className }) => {
  if (id) {
    return (
      <Link to={`/athletes/${id}`} className={`hover:underline ${className ?? ""}`.trim()}>
        {name}
      </Link>
    );
  }
  return <span className={className}>{name}</span>;
};

export default AthleteName;

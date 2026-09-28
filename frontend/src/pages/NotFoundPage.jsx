import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-7xl font-extrabold text-gray-900 tracking-tight">
        404
      </h1>
      <h2 className="text-xl font-semibold text-gray-800 mt-2">
        Page Not Found
      </h2>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">
        The page you are looking for does not exist or has been relocated.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;

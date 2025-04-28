
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-xl mt-4 mb-6">Oops! This page doesn't exist.</p>
        <p className="text-muted-foreground mb-8">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Button onClick={() => navigate("/")}>
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

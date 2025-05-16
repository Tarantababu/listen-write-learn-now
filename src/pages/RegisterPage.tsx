
import React from 'react';
import { Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  return (
    <div className="container mx-auto max-w-md py-12">
      <h1 className="text-2xl font-bold text-center mb-6">Create an Account</h1>
      <div className="space-y-4">
        {/* Registration form will be implemented later */}
        <p className="text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

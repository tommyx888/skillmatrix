import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function Unauthorized() {
  const { userRole, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Access Denied
          </h1>
          <p className="mt-6 text-base leading-7 text-gray-600">
            You don't have permission to access this page. 
            {userRole && (
              <span> Your current role is <strong>{userRole}</strong>, which doesn't have the required permissions.</span>
            )}
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <Button asChild variant="default">
            <Link to="/">Go to Home Page</Link>
          </Button>
          <Button 
            variant="outline"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}


import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { NavLink } from 'react-router-dom';
import { HelpCircle, LayoutDashboard, LogOut, Settings, User, Map } from 'lucide-react';
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Header() {
  const { settings } = useUserSettingsContext();

  return (
    <header className="bg-white border-b dark:bg-gray-900 dark:border-gray-800">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <NavLink to="/" className="text-xl font-bold text-gray-800 dark:text-white">
                LWL
              </NavLink>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  classNames(
                    isActive
                      ? 'border-primary dark:border-primary text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-500 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:border-gray-700',
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                  )
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  classNames(
                    isActive
                      ? 'border-primary dark:border-primary text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-500 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:border-gray-700',
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                  )
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/roadmap"
                className={({ isActive }) =>
                  classNames(
                    isActive
                      ? 'border-primary dark:border-primary text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-500 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:border-gray-700',
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                  )
                }
              >
                Learning Paths
              </NavLink>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Language badge */}
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              {settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)}
            </span>

            {/* Profile dropdown */}
            <Menu as="div" className="ml-3 relative">
              <div>
                <Menu.Button className="bg-white dark:bg-gray-800 rounded-full flex items-center justify-center p-1 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
                  <span className="sr-only">Open user menu</span>
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <NavLink
                        to="/dashboard"
                        className={classNames(
                          active ? 'bg-gray-100 dark:bg-gray-700' : '',
                          'flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                        )}
                      >
                        <LayoutDashboard className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Dashboard
                      </NavLink>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <NavLink
                        to="/roadmap"
                        className={classNames(
                          active ? 'bg-gray-100 dark:bg-gray-700' : '',
                          'flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                        )}
                      >
                        <Map className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Learning Paths
                      </NavLink>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-100 dark:bg-gray-700' : '',
                          'flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                        )}
                      >
                        <Settings className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Settings
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-100 dark:bg-gray-700' : '',
                          'flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                        )}
                      >
                        <HelpCircle className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Help
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-100 dark:bg-gray-700' : '',
                          'flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                        )}
                      >
                        <LogOut className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Sign out
                      </a>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
}

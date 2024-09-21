import {createBrowserRouter,RouterProvider} from 'react-router-dom'
import '@mantine/core/styles.css';
import {MantineProvider} from '@mantine/core';
import Home from './screens/home';
import './index.css';
import { Toaster } from "@/components/ui/sonner"
const paths = [
  {
    path: '/',
    element: <Home />
  },
];

const BrowserRouter = createBrowserRouter(paths);

const App = () => {
  return (
    <MantineProvider>
      <RouterProvider router={BrowserRouter}/>;
      <Toaster />
    </MantineProvider>
  );
}

export default App;
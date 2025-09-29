import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { VendorsPage } from './pages/VendorsPage';
import { VendorDetailPage } from './pages/VendorDetailPage';
import { Toast } from './components/Toast';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<VendorsPage />} />
          <Route path="/vendor/:id" element={<VendorDetailPage />} />
        </Routes>
        <Toast />
      </div>
    </Router>
  );
}

export default App;

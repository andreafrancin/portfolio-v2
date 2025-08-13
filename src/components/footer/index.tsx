import { Link } from 'react-router-dom';
import './index.scss';
import { useContext, useMemo } from 'react';
import { AuthContext } from '../../context/auth-context';

const Footer = () => {
  const { token } = useContext(AuthContext);

  return (
    <div className="footer-container">
      <Link className="footer-login-button" to={token ? '/private' : '/login'}>
        Private area
      </Link>
    </div>
  );
};

export default Footer;

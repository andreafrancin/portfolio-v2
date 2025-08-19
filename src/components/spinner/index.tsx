import './index.scss';

function Spinner({ size }: { size?: number }) {
  return <div className="spinner" style={size ? { width: size, height: size } : {}}></div>;
}

export default Spinner;

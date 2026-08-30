import { useNavigate } from 'react-router-dom';
import ConsultaStockModal from '../components/ConsultaStockModal';

const ControlStock = () => {
  const navigate = useNavigate();

  return (
    <ConsultaStockModal
      isOpen={true}
      onClose={() => navigate('/')}
    />
  );
};

export default ControlStock;

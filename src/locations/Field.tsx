import useAutoResizer from '../hooks/useAutoResizer';
import SortingWrapper from '../components/SortingWrapper/SortingWrapper';

const Field = () => {

	useAutoResizer();

	return (
    <SortingWrapper />
  );
};

export default Field;

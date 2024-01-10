import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import useAutoResizer from '../hooks/useAutoResizer';
import SortingWrapper from '../components/SortingWrapper/SortingWrapper';

const Field = () => {
	const sdk = useSDK<FieldAppSDK>();
	useAutoResizer();

	return (
    <SortingWrapper sdk={sdk} />
  );
};

export default Field;

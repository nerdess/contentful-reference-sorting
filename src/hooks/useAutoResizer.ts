import { useEffect } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { FieldAppSDK } from '@contentful/app-sdk';

const useAutoResizer = (): void => {

    const sdk = useSDK<FieldAppSDK>();
    const window = sdk.window;

	useEffect(() => {
		window.startAutoResizer();
		return () => window.stopAutoResizer();
	}, [window]);

};

export default useAutoResizer;
import { useEffect, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { createClient, Space, Environment } from 'contentful-management';
import { FieldAppSDK } from '@contentful/app-sdk';

export interface CMAResponse {
	isLoading: boolean;
	space: Space | undefined;
	environment: Environment | undefined;
  }

const useCMA = (): CMAResponse => {

	const sdk = useSDK<FieldAppSDK>();
	const [space, setSpace] = useState<Space | undefined>();
	const [environment, setEnvironment] = useState<Environment | undefined>();

	useEffect(() => {
		const cma = createClient({ apiAdapter: sdk.cmaAdapter });

		cma.getSpace(sdk.ids.space).then((space) => {

			setSpace(space);

			space.getEnvironment(sdk.ids.environment).then((environment) => {
				setEnvironment(environment);
			});
		});
	}, [sdk]);

	return {
		isLoading: !space || !environment,
		space,
		environment,
	};
};

export default useCMA;

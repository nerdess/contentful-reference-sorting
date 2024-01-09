import { FieldAppSDK } from '@contentful/app-sdk';
import {
	Box,
	Button,
	ButtonGroup,
	Spinner,
	Stack,
	Text,
} from '@contentful/f36-components';
import { MultipleEntryReferenceEditor } from '@contentful/field-editor-reference';
import { useCallback, useMemo, useState } from 'react';
import useCMA from '../../hooks/useCMA';
import _ from 'lodash';

export interface EntrySaved {
	sys: {
		type: 'Link';
		linkType: string;
		id: string;
	};
}

const getIds = (value: any) => {
	if (Array.isArray(value)) {
		return value.map(({ sys }) => sys.id);
	}

	if (!Array.isArray(value) && typeof value === 'object' && value !== null) {
		return [value.sys.id];
	}

	return [];
};

const SortingWrapper = ({ sdk }: { sdk: FieldAppSDK }) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const ids = useMemo(() => getIds(sdk.field.getValue()), [sdk.field]);

	const { isLoading: isLoadingCMA, environment } = useCMA();

	console.log('sdk.field.getValue()', sdk.field.getValue());

	const sortBy = useCallback(
		(type) => {
			if (!environment) return;
			setIsLoading(true);

			const promises = ids.map((id) => {
				return environment.getEntry(id);
			});

			Promise.allSettled(promises).then((results) => {
				const entries = results.map((result, i) => {
					if (result.status === 'fulfilled' && result.value) {
						return result.value;
					}
					return {
						sys: {
							id: ids[i],
						},
					};
				});

				const sortedIds = _.orderBy(entries, ['fields.title.en-US']).map(
					(entry) => {
						return {
							sys: {
								id: entry.sys.id,
								type: 'Link',
								linkType: 'Entry',
							},
						};
					}
				);

				sdk.field.setValue(sortedIds);

				setIsLoading(false);
			});
		},
		[sdk, environment, ids]
	);

	return (
		<Stack flexDirection='column' spacing='spacingS' alignItems='end'>
			<Stack spacing='spacingXs'>
				{isLoading && <Spinner />}
				<Text>Sort</Text>
				{isLoadingCMA ? (
					<Spinner />
				) : (
					<ButtonGroup>
						<Button
							variant='secondary'
							size='small'
							onClick={() => sortBy('title')}
						>
							Alphabetically (by title)
						</Button>
						<Button variant='secondary' size='small'>
							Chronologically
						</Button>
					</ButtonGroup>
				)}
			</Stack>
			<Box style={{ width: '100%' }}>
				<MultipleEntryReferenceEditor
					//renderCustomCard={customRenderer}
					//renderCustomChildren={({entry, contentType}) => renderCustomChildren(entry, contentType)}
					viewType='link'
					sdk={sdk}
					isInitiallyDisabled
					hasCardEditActions={false}
					parameters={{
						instance: {
							/*showCreateEntityAction: !!showCreateEntityAction,
                            showLinkEntityAction: !!showLinkEntityAction,
                            bulkEditing: !!bulkEditing*/
							showCreateEntityAction: true,
							showLinkEntityAction: true,
							bulkEditing: true,
						},
					}}
				/>
			</Box>
		</Stack>
	);
};

export default SortingWrapper;

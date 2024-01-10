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
import { useCallback, useState } from 'react';
import useCMA from '../../hooks/useCMA';
import { ContentType, Entry } from 'contentful-management';
import { replaceUmlautsWithVowels } from '../../lib/replaceUmlautsWithVowels';
import { SortBy, EntrySaved, EntryWithError } from './SortingWrapper.d';
import { getIds } from '../../lib/getIds';
import _ from 'lodash';
import './sortingWrapper.scss';

const SortingWrapper = ({ sdk }: { sdk: FieldAppSDK }) => {

    const showCreateEntityAction = sdk.parameters.instance.showCreateEntityAction;
	const showLinkEntityAction = sdk.parameters.instance.showLinkEntityAction;
	const bulkEditing = sdk.parameters.instance.bulkEditing;
	const [entryLength, setEntryLength] = useState<number>(
		sdk.field.getValue()?.length || 0
	);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { isLoading: isLoadingCMA, environment } = useCMA();

    console.log('bulkEditing', sdk.parameters.instance);

	const sortBy = useCallback(

		(type: SortBy) => {

			if (!environment) return;

			setIsLoading(true);

			const ids = getIds(sdk.field.getValue());

			const promises = ids.map((id) => {
				return environment.getEntry(id);
			});

			Promise.allSettled(promises).then((results) => {
				const entries = results
					.map((result, i) => {
						if (result.status === 'fulfilled' && !!result.value) {
							return result.value as Entry;
						} 
						return {
                            sys: {
                                id: ids[i]
                            }
                        } as EntryWithError;
					})


				if (type === 'title') {

					const validEntries = _.uniq(
						entries.filter((entry) => {
                            return entry.sys.hasOwnProperty('contentType')
						})
					) as Entry[];

                    const contentTypes = validEntries.map(
                        (entry: Entry) => entry.sys.contentType.sys.id
                    );

					const promises = contentTypes.map((id) =>
						!!id ? environment.getContentType(id) : null
					);

					Promise.allSettled(promises).then((results) => {
						const contentTypes = results
							.map((result, i) => {
								if (result.status === 'fulfilled' && result.value) {
									return result.value as ContentType;
								}
								return null;
							})
							.filter(
								(contentType): contentType is ContentType => !!contentType
							);

						const titles = entries.map((entry: Entry | EntryWithError) => {

                            let title;

                            if ('sys' in entry && 'contentType' in entry.sys && 'fields' in entry) {
							    const displayField = contentTypes.find((contentType: ContentType) => contentType.sys.id === entry.sys.contentType.sys.id)?.displayField;
							    title = _.isEmpty(entry.fields) ? null : replaceUmlautsWithVowels(entry.fields[displayField as string][sdk.field.locale].toLowerCase());
                            } 
							const id = entry.sys.id;

							return {
								title,
								id,
							};
						});

						const sorted = _.orderBy(titles, ['title']).map(({ id }) => {
							return {
								sys: {
									id,
									type: 'Link',
									linkType: 'Entry',
								},
							} as EntrySaved;
						});

						sdk.field.setValue(sorted);
						setIsLoading(false);
					});
				}

                if (type === 'date') {
                    const sorted = _.orderBy(entries, [(obj: Entry | EntryWithError) => {
                        if ('sys' in obj && 'updatedAt' in obj.sys) {
                            return new Date(obj.sys.updatedAt);
                        }
                        return null;
                    }], ['desc']).map((entry ) => {
                        return {
                            sys: {
                                id: entry.sys.id,
                                type: 'Link',
                                linkType: 'Entry',
                            }
                        } as EntrySaved;
                    });
                    sdk.field.setValue(sorted);
                    setIsLoading(false);
                }


			});
		},
		[sdk, environment]
	);

	return (
		<Stack flexDirection='column' spacing='spacingS' alignItems='end'>
			{entryLength > 0 && (
				<Stack spacing='spacingXs'>
					{isLoading && <Spinner />}
					<Text>Sort</Text>
					{isLoadingCMA ? (
						<Spinner />
					) : (
						<ButtonGroup className="sorting-wrapper-trigger">
							<Button
								variant='secondary'
								size='small'
								onClick={() => sortBy('title')}
							>
								Alphabetically <small>(by title)</small>
							</Button>
							<Button 
                                variant='secondary' 
                                size='small'
                                onClick={() => sortBy('date')}
                            >
								Chronologically <small>(by last updated at)</small>
							</Button>
						</ButtonGroup>
					)}
				</Stack>
			)}
			<Box style={{ width: '100%' }}>
				<MultipleEntryReferenceEditor
					viewType='link'
					sdk={sdk}
					isInitiallyDisabled
					hasCardEditActions={false}
					onAction={() => {
						setEntryLength(sdk.field.getValue().length || 0);
					}}
					parameters={{
						instance: {
							showCreateEntityAction: !!showCreateEntityAction,
                            showLinkEntityAction: !!showLinkEntityAction,
                            bulkEditing: !!bulkEditing,
						},
					}}
				/>
			</Box>
		</Stack>
	);
};

export default SortingWrapper;

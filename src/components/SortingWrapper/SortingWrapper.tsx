import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import {
	Box,
	ButtonGroup,
	IconButton,
	Menu,
	Spinner,
	Stack,
	Text,
} from '@contentful/f36-components';
import {
	SortIcon,
	ArrowUpwardIcon,
	ArrowDownwardIcon,
} from '@contentful/f36-icons';
import { MultipleEntryReferenceEditor } from '@contentful/field-editor-reference';
import React, { useCallback, useState } from 'react';
import useCMA from '../../hooks/useCMA';
import { ContentType, Entry } from 'contentful-management';
import { replaceUmlautsWithVowels } from '../../lib/replaceUmlautsWithVowels';
import { SortBy, EntrySaved, EntryWithError } from './SortingWrapper.d';
import { getIds } from '../../lib/getIds';
import tokens from '@contentful/f36-tokens';
import _ from 'lodash';
import './sortingWrapper.scss';

const SortingButtons = ({
	sortAsc,
	sortDesc,
	label,
}: {
	sortAsc: () => void;
	sortDesc: () => void;
	label: React.ReactNode | string;
}) => {
	return (
		<Stack fullWidth justifyContent='space-between'>
			<Box>{label}</Box>
			<ButtonGroup>
				<IconButton
					size='small'
					variant='secondary'
					aria-label='Aufsteigend sortieren'
					onClick={sortAsc}
					icon={<ArrowUpwardIcon />}
				/>
				<IconButton
					size='small'
					variant='secondary'
					aria-label='Absteigend sortieren'
					onClick={sortDesc}
					icon={<ArrowDownwardIcon />}
				/>
			</ButtonGroup>
		</Stack>
	);
};

const SortingWrapper = () => {
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { isLoading: isLoadingCMA, environment } = useCMA();
	const sdk = useSDK<FieldAppSDK>();

	const {
		showCreateEntityAction,
		showLinkEntityAction,
		bulkEditing,
		sortAlphabetically,
		sortChronologically,
		sortCustomFields,
	} = sdk.parameters.instance;

	const [entryLength, setEntryLength] = useState<number>(
		sdk.field.getValue()?.length || 0
	);

	const sortBy = useCallback(
		({
			type,
			order,
			field,
		}: {
			type: SortBy;
			order: 'asc' | 'desc';
			field?: string;
		}) => {
			if (!environment) return;

			setIsLoading(true);

			const ids = getIds(sdk.field.getValue());

			const promises = ids.map((id) => {
				return environment.getEntry(id);
			});

			Promise.allSettled(promises).then((results) => {
				const entries = results.map((result, i) => {
					if (result.status === 'fulfilled' && !!result.value) {
						return result.value as Entry;
					}
					return {
						sys: {
							id: ids[i],
						},
					} as EntryWithError;
				});

				if (type === 'title') {

					const validEntries = _.uniq(
						entries.filter((entry) => {
							return entry.sys.hasOwnProperty('contentType');
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

							if (
								'sys' in entry &&
								'contentType' in entry.sys &&
								'fields' in entry
							) {
								const displayField = contentTypes.find(
									(contentType: ContentType) =>
										contentType.sys.id === entry.sys.contentType.sys.id
								)?.displayField;
								title = _.isEmpty(entry.fields)
									? null
									: replaceUmlautsWithVowels(
											entry.fields[displayField as string][
												sdk.field.locale
											].toLowerCase()
									  );
							}
							const id = entry.sys.id;

							return {
								title,
								id,
							};
						});

						const sorted = _.orderBy(titles, ['title'], [order]).map(
							({ id }) => {
								return {
									sys: {
										id,
										type: 'Link',
										linkType: 'Entry',
									},
								} as EntrySaved;
							}
						);

						sdk.field.setValue(sorted);
						setIsLoading(false);
					});
				}

				if (type === 'date') {
					const sorted = _.orderBy(
						entries,
						[
							(obj: Entry | EntryWithError) => {
								if ('sys' in obj && 'updatedAt' in obj.sys) {
									return new Date(obj.sys.updatedAt);
								}
								return order === 'desc' ? '' : null;
							},
						],
						[order]
					).map((entry) => {
						return {
							sys: {
								id: entry.sys.id,
								type: 'Link',
								linkType: 'Entry',
							},
						} as EntrySaved;
					});
					sdk.field.setValue(sorted);
					setIsLoading(false);
				}

				if (type === 'field') {
					const sorted = _.orderBy(
						entries,
						[
							(obj: Entry | EntryWithError) => {
								if (
									'fields' in obj &&
									obj.fields[field as string] &&
									obj.fields[field as string][sdk.field.locale]
								) {
									return obj.fields[field as string][sdk.field.locale];
								}
								return order === 'desc' ? '' : null;
							},
						],
						[order]
					).map((entry) => {
						return {
							sys: {
								id: entry.sys.id,
								type: 'Link',
								linkType: 'Entry',
							},
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
			{entryLength > 1 && (
				<Stack spacing='spacingXs'>
					{isLoading && <Spinner />}
					<Text>Sort by</Text>
					{isLoadingCMA ? (
						<Spinner />
					) : (
						<Menu>
							<Menu.Trigger>
								<IconButton
									variant='secondary'
									icon={<SortIcon />}
									aria-label='toggle menu'
								/>
							</Menu.Trigger>
							<Menu.List style={{backgroundColor: tokens.gray100, borderRight: `1px solid ${tokens.gray200}`}}>
								{sortAlphabetically && (
									<Menu.Item>
										<SortingButtons
											sortAsc={() => sortBy({ type: 'title', order: 'asc' })}
											sortDesc={() => sortBy({ type: 'title', order: 'desc' })}
											label={
												<>
													Alphabetically <small>(by entry title)</small>
												</>
											}
										/>
									</Menu.Item>
								)}
								{sortChronologically && (
									<Menu.Item>
										<SortingButtons
											sortAsc={() => sortBy({ type: 'date', order: 'asc' })}
											sortDesc={() => sortBy({ type: 'date', order: 'desc' })}
											label={
												<>
													Chronologically <small>(by last updated at)</small>
												</>
											}
										/>
									</Menu.Item>
								)}
								{sortCustomFields &&
									sortCustomFields.split(',').map((field: string) => {
										return (
											<Menu.Item key={field}>
												<SortingButtons
													sortAsc={() =>
														sortBy({
															type: 'field',
															order: 'asc',
															field: field.trim(),
														})
													}
													sortDesc={() =>
														sortBy({
															type: 'field',
															order: 'desc',
															field: field.trim(),
														})
													}
													label={
														<>
															Field <small>({field})</small>
														</>
													}
												/>
											</Menu.Item>
										);
									})}
							</Menu.List>
						</Menu>
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

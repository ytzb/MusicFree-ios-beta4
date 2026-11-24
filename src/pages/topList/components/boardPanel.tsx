import React, { memo, useMemo } from "react";
import { SectionList, StyleSheet, View } from "react-native";
import rpx from "@/utils/rpx";
import { IPluginTopListResult } from "../store/atoms";
import { RequestStateCode } from "@/constants/commonConst";
import TopListItem from "@/components/mediaItem/topListItem";
import ThemeText from "@/components/base/themeText";
import ListEmpty from "@/components/base/listEmpty";
import useColors from "@/hooks/useColors";
import Color from "color";

interface IBoardPanelProps {
    hash: string;
    topListData?: IPluginTopListResult;
    onRetry?: () => void;
}

interface ITopListSection {
    title?: string;
    data: IMusic.IMusicSheetItemBase[][];
    total: number;
}

function buildRows<T>(items: T[], columnCount = 2): T[][] {
    const rows: T[][] = [];
    for (let i = 0; i < items.length; i += columnCount) {
        rows.push(items.slice(i, i + columnCount));
    }
    return rows;
}

function SkeletonCard() {
    const colors = useColors();
    const skeletonColor = Color(colors.text).alpha(0.08).toString();
    const skeletonLight = Color(colors.text).alpha(0.16).toString();

    return (
        <View
            style={[
                style.cardSkeleton,
                {
                    backgroundColor: colors.card,
                    borderColor: Color(colors.text).alpha(0.08).toString(),
                },
            ]}>
            <View
                style={[
                    style.coverSkeleton,
                    { backgroundColor: skeletonLight },
                ]}
            />
            <View
                style={[style.lineSkeletonLarge, { backgroundColor: skeletonLight }]}
            />
            <View
                style={[style.lineSkeletonMedium, { backgroundColor: skeletonColor }]}
            />
            <View
                style={[style.lineSkeletonShort, { backgroundColor: skeletonColor }]}
            />
        </View>
    );
}

function TopListSkeleton() {
    return (
        <View style={style.body}>
            <View style={style.section}>
                <View style={style.sectionHeader}>
                    <View>
                        <ThemeText fontWeight="bold" fontSize="title">
                            官方榜
                        </ThemeText>
                        <ThemeText fontColor="textSecondary" fontSize="description">
                            正在加载当前插件榜单
                        </ThemeText>
                    </View>
                </View>
                <View style={style.row}>
                    <SkeletonCard />
                    <View style={style.rowGap} />
                    <SkeletonCard />
                </View>
            </View>
        </View>
    );
}

function BoardPanel(props: IBoardPanelProps) {
    const { hash, topListData, onRetry } = props ?? {};
    const colors = useColors();

    const sections = topListData?.data ?? [];
    const sectionRows = useMemo<ITopListSection[]>(
        () =>
            sections.map(section => ({
                title: section.title,
                data: buildRows(section.data ?? []),
                total: section.data?.length ?? 0,
            })),
        [sections],
    );

    const renderRow = (items: IMusic.IMusicSheetItemBase[]) => {
        return (
            <View style={style.row}>
                {items.map((item, index) => {
                    return (
                        <React.Fragment key={item.id}>
                            {index > 0 ? <View style={style.rowGap} /> : null}
                            <TopListItem
                                pluginHash={hash}
                                topListItem={item}
                                badgeLabel={item.platform}
                            />
                        </React.Fragment>
                    );
                })}
                {items.length === 1 ? <View style={style.cardSpacer} /> : null}
            </View>
        );
    };

    if (
        !topListData ||
        topListData.state === RequestStateCode.IDLE ||
        topListData.state === RequestStateCode.PENDING_REST_PAGE
    ) {
        return <TopListSkeleton />;
    }

    if (topListData.state === RequestStateCode.ERROR) {
        return <ListEmpty state={topListData.state} onRetry={onRetry} />;
    }

    if (!sections.length) {
        return <ListEmpty state={topListData.state} onRetry={onRetry} />;
    }

    return (
        <SectionList
            style={style.wrapper}
            contentContainerStyle={style.body}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled
            sections={sectionRows}
            keyExtractor={(item, index) =>
                item.map(_ => _.id).join("-") || `row-${index}`
            }
            renderItem={({ item }) => renderRow(item)}
            renderSectionHeader={({ section }) => {
                if (!section.title) {
                    return null;
                }
                return (
                    <View
                        style={[
                            style.sectionHeader,
                            {
                                backgroundColor: Color(colors.background)
                                    .alpha(0.94)
                                    .rgb()
                                    .toString(),
                                borderBottomColor: Color(colors.text)
                                    .alpha(0.06)
                                    .toString(),
                            },
                        ]}>
                        <ThemeText fontWeight="bold" fontSize="title">
                            {section.title}
                        </ThemeText>
                        <ThemeText
                            fontColor="textSecondary"
                            fontSize="description"
                            style={style.sectionSubtitle}>
                            {section.total} 个榜单
                        </ThemeText>
                    </View>
                );
            }}
        />
    );
}

export default memo(
    BoardPanel,
    (prev, curr) => prev.topListData === curr.topListData,
);

const style = StyleSheet.create({
    wrapper: {
        width: rpx(750),
    },
    body: {
        paddingTop: rpx(12),
        paddingBottom: rpx(36),
    },
    section: {
        paddingHorizontal: rpx(24),
        marginBottom: rpx(20),
    },
    sectionHeader: {
        paddingHorizontal: rpx(24),
        paddingTop: rpx(22),
        paddingBottom: rpx(18),
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sectionSubtitle: {
        marginTop: rpx(10),
    },
    row: {
        flexDirection: "row",
        alignItems: "stretch",
        paddingHorizontal: rpx(24),
        marginBottom: rpx(12),
    },
    rowGap: {
        width: rpx(12),
    },
    cardSpacer: {
        flex: 1,
    },
    cardSkeleton: {
        flex: 1,
        minHeight: rpx(468),
        borderRadius: rpx(28),
        borderWidth: 1,
        padding: rpx(18),
    },
    coverSkeleton: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: rpx(22),
        marginBottom: rpx(14),
    },
    lineSkeletonLarge: {
        height: rpx(32),
        width: "70%",
        borderRadius: rpx(999),
        marginBottom: rpx(12),
    },
    lineSkeletonMedium: {
        height: rpx(24),
        width: "100%",
        borderRadius: rpx(999),
        marginBottom: rpx(10),
    },
    lineSkeletonShort: {
        height: rpx(24),
        width: "55%",
        borderRadius: rpx(999),
    },
});

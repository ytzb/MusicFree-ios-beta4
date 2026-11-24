import React, { useMemo } from "react";
import {
    Pressable,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import ThemeText from "@/components/base/themeText";
import FastImage from "@/components/base/fastImage";
import Icon from "@/components/base/icon";
import { ImgAsset } from "@/constants/assetsConst";
import { ROUTE_PATH, useNavigate } from "@/core/router";
import useColors from "@/hooks/useColors";
import rpx from "@/utils/rpx";
import Color from "color";

interface ITopListResultsProps {
    pluginHash: string;
    topListItem: IMusic.IMusicSheetItemBase;
    badgeLabel?: string;
    rankLabel?: string;
    style?: StyleProp<ViewStyle>;
}

export default function TopListItem(props: ITopListResultsProps) {
    const {
        pluginHash,
        topListItem,
        badgeLabel,
        rankLabel,
        style,
    } = props;
    const navigate = useNavigate();
    const colors = useColors();

    const description = useMemo(() => {
        return (
            topListItem.description?.trim() ||
            topListItem.artist?.trim() ||
            `${topListItem.platform} 榜单`
        );
    }, [topListItem]);

    const extraInfo = useMemo(() => {
        if (topListItem.worksNum) {
            return `${topListItem.worksNum} 首`;
        }
        return "";
    }, [topListItem]);

    const badgeText = badgeLabel ?? topListItem.platform;
    const coverSource = topListItem.artwork ?? topListItem.coverImg;
    const accentColor = colors.primary;
    const cardBackground = Color(colors.card).mix(Color("#0b1524"), 0.3).hex();
    const borderColor = Color(colors.text).alpha(0.08).toString();
    const descriptionColor = Color(colors.text)
        .alpha(0.68)
        .rgb()
        .toString();
    const overlayDark = Color("#08111f").alpha(0.1).rgb().toString();
    const overlayLight = Color(accentColor).alpha(0.22).rgb().toString();
    const coverFallbackStart = Color(accentColor).alpha(0.82).rgb().toString();
    const coverFallbackEnd = Color(colors.card).mix(Color("#08111f"), 0.5).hex();
    const badgeBackground = Color("#08111f").alpha(0.45).rgb().toString();
    const rankBackground = Color("#08111f").alpha(0.24).rgb().toString();

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                {
                    backgroundColor: cardBackground,
                    borderColor,
                    opacity: pressed ? 0.92 : 1,
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                },
                style,
            ]}
            onPress={() => {
                navigate(ROUTE_PATH.TOP_LIST_DETAIL, {
                    pluginHash,
                    topList: topListItem,
                });
            }}>
            <View style={styles.coverWrapper}>
                <LinearGradient
                    colors={[coverFallbackStart, coverFallbackEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.coverGradient}
                />
                <FastImage
                    style={styles.coverImage}
                    source={coverSource}
                    placeholderSource={ImgAsset.albumDefault}
                />
                <LinearGradient
                    colors={[overlayLight, overlayDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.coverOverlay}
                />
                {badgeText ? (
                    <View
                        style={[
                            styles.badge,
                            { backgroundColor: badgeBackground },
                        ]}>
                        <Icon name="trophy" size={rpx(20)} color="#fff" />
                        <ThemeText
                            color="#fff"
                            fontSize="tag"
                            fontWeight="semibold">
                            {badgeText}
                        </ThemeText>
                    </View>
                ) : null}
                {rankLabel ? (
                    <View
                        style={[
                            styles.rankTag,
                            { backgroundColor: rankBackground },
                        ]}>
                        <ThemeText
                            color="#fff"
                            fontSize="subTitle"
                            fontWeight="bolder">
                            {rankLabel}
                        </ThemeText>
                    </View>
                ) : null}
            </View>

            <View style={styles.content}>
                <ThemeText
                    fontWeight="bold"
                    fontSize="subTitle"
                    numberOfLines={2}
                    style={styles.title}>
                    {topListItem.title}
                </ThemeText>
                <ThemeText
                    fontSize="description"
                    numberOfLines={2}
                    style={[styles.description, { color: descriptionColor }]}>
                    {description}
                </ThemeText>
                {extraInfo ? (
                    <View style={styles.footer}>
                        <ThemeText fontWeight="semibold">{extraInfo}</ThemeText>
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minHeight: rpx(468),
        borderRadius: rpx(28),
        borderWidth: 1,
        padding: rpx(18),
        overflow: "hidden",
    },
    coverWrapper: {
        position: "relative",
        width: "100%",
        aspectRatio: 1,
        borderRadius: rpx(22),
        overflow: "hidden",
        marginBottom: rpx(14),
    },
    coverGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    coverImage: {
        ...StyleSheet.absoluteFillObject,
    },
    coverOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    badge: {
        position: "absolute",
        top: rpx(14),
        left: rpx(14),
        flexDirection: "row",
        alignItems: "center",
        gap: rpx(6),
        paddingHorizontal: rpx(14),
        paddingVertical: rpx(8),
        borderRadius: rpx(999),
    },
    rankTag: {
        position: "absolute",
        right: rpx(14),
        bottom: rpx(14),
        minWidth: rpx(74),
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: rpx(16),
        paddingVertical: rpx(8),
        borderRadius: rpx(999),
    },
    content: {
        flex: 1,
    },
    title: {
        lineHeight: rpx(38),
    },
    description: {
        marginTop: rpx(8),
        lineHeight: rpx(30),
        minHeight: rpx(60),
    },
    footer: {
        marginTop: rpx(14),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
    },
});

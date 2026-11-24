import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import rpx from "@/utils/rpx";
import timeformat from "@/utils/timeformat";
import { fontSizeConst } from "@/constants/uiConst";
import TrackPlayer, { useProgress } from "@/core/trackPlayer";

const THUMB_SIZE = rpx(20);
const THUMB_HIT = rpx(48);

function formatTime(time: number) {
    return timeformat(Math.max(time, 0));
}

export default function SeekBar() {
    const progress = useProgress(1000);
    const [tmpProgress, setTmpProgress] = useState<number | null>(null);
    const isSlidingRef = useRef(false);

    const duration = progress.duration > 0 ? progress.duration : 1;
    const displayPosition = tmpProgress ?? progress.position;
    const ratio = Math.min(Math.max(displayPosition / duration, 0), 1);

    const seekRatio = useSharedValue(ratio);
    const thumbScale = useSharedValue(1);
    const trackWidthSV = useSharedValue(0);

    useEffect(() => {
        if (!isSlidingRef.current) {
            seekRatio.value = ratio;
        }
    }, [ratio, seekRatio]);

    const onTrackLayout = useCallback(
        (e: LayoutChangeEvent) => {
            trackWidthSV.value = e.nativeEvent.layout.width;
        },
        [trackWidthSV],
    );

    const seekToPosition = useCallback(
        (position: number) => {
            let next = position;
            if (progress.duration > 0 && next >= progress.duration - 2) {
                next = Math.max(progress.duration - 2, 0);
            }
            TrackPlayer.seekTo(next);
        },
        [progress.duration],
    );

    const startSliding = useCallback((position: number) => {
        isSlidingRef.current = true;
        setTmpProgress(position);
    }, []);

    const updateTmpProgress = useCallback((position: number) => {
        setTmpProgress(position);
    }, []);

    const finishSeek = useCallback(
        (position: number) => {
            isSlidingRef.current = false;
            setTmpProgress(null);
            seekToPosition(position);
        },
        [seekToPosition],
    );

    const gesture = useMemo(() => {
        return Gesture.Pan()
            .minDistance(0)
            .onBegin(e => {
                "worklet";
                const width = trackWidthSV.value;
                if (width <= 0) {
                    return;
                }
                const nextRatio = Math.min(Math.max(e.x / width, 0), 1);
                seekRatio.value = nextRatio;
                thumbScale.value = withTiming(1.4, { duration: 120 });
                runOnJS(startSliding)(nextRatio * duration);
            })
            .onUpdate(e => {
                "worklet";
                const width = trackWidthSV.value;
                if (width <= 0) {
                    return;
                }
                const nextRatio = Math.min(Math.max(e.x / width, 0), 1);
                seekRatio.value = nextRatio;
                runOnJS(updateTmpProgress)(nextRatio * duration);
            })
            .onFinalize(e => {
                "worklet";
                const width = trackWidthSV.value;
                thumbScale.value = withTiming(1, { duration: 120 });
                if (width <= 0) {
                    runOnJS(finishSeek)(0);
                    return;
                }
                const nextRatio = Math.min(Math.max(e.x / width, 0), 1);
                seekRatio.value = nextRatio;
                runOnJS(finishSeek)(nextRatio * duration);
            });
    }, [
        duration,
        finishSeek,
        seekRatio,
        startSliding,
        thumbScale,
        trackWidthSV,
        updateTmpProgress,
    ]);

    const activeTrackStyle = useAnimatedStyle(() => ({
        width: seekRatio.value * trackWidthSV.value,
    }));

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateX:
                    seekRatio.value * trackWidthSV.value - THUMB_SIZE / 2,
            },
            { scale: thumbScale.value },
        ],
    }));

    return (
        <View style={style.wrapper}>
            <GestureDetector gesture={gesture}>
                <View style={style.trackHitSlop} onLayout={onTrackLayout}>
                    <View style={style.track}>
                        <Animated.View
                            style={[style.activeTrack, activeTrackStyle]}
                        />
                    </View>
                    <Animated.View style={[style.thumb, thumbStyle]} />
                </View>
            </GestureDetector>
            <View style={style.timeRow}>
                <Text style={style.timeText}>{formatTime(displayPosition)}</Text>
                <Text style={style.timeText}>
                    {formatTime(progress.duration)}
                </Text>
            </View>
        </View>
    );
}

const style = StyleSheet.create({
    wrapper: {
        width: "100%",
        paddingHorizontal: rpx(48),
    },
    trackHitSlop: {
        width: "100%",
        height: THUMB_HIT,
        justifyContent: "center",
        overflow: "visible",
    },
    track: {
        width: "100%",
        height: rpx(6),
        borderRadius: rpx(3),
        backgroundColor: "rgba(255, 255, 255, 0.22)",
        overflow: "hidden",
    },
    activeTrack: {
        height: "100%",
        borderRadius: rpx(3),
        backgroundColor: "rgba(255, 255, 255, 0.92)",
    },
    thumb: {
        position: "absolute",
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: "#ffffff",
        top: (THUMB_HIT - THUMB_SIZE) / 2,
        left: 0,
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 3,
    },
    timeRow: {
        marginTop: rpx(4),
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    timeText: {
        fontSize: fontSizeConst.description,
        includeFontPadding: false,
        fontVariant: ["tabular-nums"],
        color: "rgba(255, 255, 255, 0.55)",
    },
});

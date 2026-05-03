import React, { useRef, useEffect } from "react";
import { Group, Circle } from "react-konva";

export const SocketIcon = React.memo(({ colors: COLORS, hasSocket, type, width }) => {
    if (!hasSocket) return null;
    const xPos = type === 'round_table' ? 0 : width - 20;
    const yPos = type === 'round_table' ? 0 : 20;

    return (
        <Group x={xPos} y={yPos}>
            <Circle radius={8} fill="white" stroke={COLORS.SOCKET} strokeWidth={1} />
        </Group>
    );
});
import React from 'react';
import { useEffect } from 'react';
import type { SVGProps } from 'react';

export default function EosIconsThreeDotsLoading(props: SVGProps<SVGSVGElement>) {
    const [time, setTime] = React.useState<boolean>(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            setTime(true);
        }, 5000);

        return () => {
            clearTimeout(timer);
        };
    }, []);
	return (
        <>
            {time && <p className="m-4">You seem to have lost connection. Try refreshing?</p>}
            {!time && <svg xmlns="http://www.w3.org/2000/svg" width="4rem" height="4rem" viewBox="0 0 24 24" {...props}><circle cx={18} cy={12} r={0} fill="#e0e0e0"><animate attributeName="r" begin={0.67} calcMode="spline" dur="1.5s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"></animate></circle><circle cx={12} cy={12} r={0} fill="#e0e0e0"><animate attributeName="r" begin={0.33} calcMode="spline" dur="1.5s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"></animate></circle><circle cx={6} cy={12} r={0} fill="#e0e0e0"><animate attributeName="r" begin={0} calcMode="spline" dur="1.5s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"></animate></circle></svg>}
        </>
    );
}
import React from 'react';
import { useEffect } from 'react';
import type { SVGProps } from 'react';

interface LoaderProps {
    lang: string;
}

export default function EosIconsThreeDotsLoading({ lang, ...props }: SVGProps<SVGSVGElement> & LoaderProps) {
    const [time, setTime] = React.useState<boolean>(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            setTime(true);
        }, 7500);

        return () => {
            clearTimeout(timer);
        };
    }, []);
	return (
        <div className='flex justify-center'>
            {time && (lang === 'en') && <p className="m-4">You seem to have lost connection. Try refreshing?</p>}
            {time && (lang === 'de') && <p className="m-4">Sie scheinen die Verbindung verloren zu haben. Haben Sie versucht, die Verbindung zu aktualisieren?</p>}
            {!time && <svg xmlns="http://www.w3.org/2000/svg" width="4rem" height="4rem" viewBox="0 0 24 24" {...props}><circle cx={18} cy={12} r={0} fill="#e0e0e0"><animate attributeName="r" begin={0.67} calcMode="spline" dur="1.5s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"></animate></circle><circle cx={12} cy={12} r={0} fill="#e0e0e0"><animate attributeName="r" begin={0.33} calcMode="spline" dur="1.5s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"></animate></circle><circle cx={6} cy={12} r={0} fill="#e0e0e0"><animate attributeName="r" begin={0} calcMode="spline" dur="1.5s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"></animate></circle></svg>}
        </div>
    );
}
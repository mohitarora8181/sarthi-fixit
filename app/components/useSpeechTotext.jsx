"use Client"

import { useEffect, useRef, useState } from 'react'

const useSpeechToText = (props) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [micStatus, setMicStatus] = useState(false);
    const [responseTime, setResponseTime] = useState(0);
    const recognitionRef = useRef(null);
    const isListeningRef = useRef(isListening);
    const [finalTranscript, setFinalTranscript] = useState('');
    const lastSpokenTimeRef = useRef(null);
    const timeoutRef = useRef(null);
    const micStatusRef = useRef(micStatus);

    useEffect(() => {
        // console.log(props.lang);
        if (!('webkitSpeechRecognition' in window)) {
            console.log('web speech is not supported');
            return;
        }

        // if (recognitionRef.current) {
        //     recognitionRef.current.stop();
        //     clearTimeout(timeoutRef.current);
        // }

        recognitionRef.current = new window.webkitSpeechRecognition()
        const recognition = recognitionRef.current
        recognition.interimResults = props.interimResults || true
        recognition.lang = props.lang || "en-IN"
        recognition.continuous = props.continuous || false

        recognition.onresult = (event) => {
            // console.log(isListeningRef.current);
            if(isListeningRef.current){

                console.log("started listening")
                const startTime = performance.now();
                let text = ""
                for (let i = 0; i < event.results.length; i++) {
                    text += event.results[i][0].transcript
                }
                
                setTranscript(text);
                console.log("text:", text);
                const endTime = performance.now();
                console.log("end time:", endTime);
                setResponseTime(endTime - startTime);
                clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    setFinalTranscript(text);
                    console.log("final transcript:", finalTranscript);
                    console.log("transcript:", transcript);
                    recognition.stop();
                    setIsListening(false);
                    setMicStatus(false);
                }, 2000); // 3 seconds timeout
                // clearTimeout(timeoutRef.current);
                // startTimeout();
            }
        }

        //  recognition.onerror = (event) =>{

        //  }

        recognition.onspeechend = () => {
            console.log("ended listening")
            recognition.stop();
            setIsListening(false);
            setMicStatus(false);
            setTranscript('');
        }


        return () => {
            recognition.stop();
            // clearTimeout(timeoutRef.current);
            console.log(props.lang)
        }

    }, [props.lang])

    useEffect(() => {
        isListeningRef.current = isListening; // Update the value of isListeningRef when isListening changes
        micStatusRef.current = micStatus;
    }, [isListening, micStatus]);

    // useEffect(()=>{
    //     console.log(responseTime);
    // },[responseTime])

    const startListening = () => {
        // if (recognitionRef.current && !isListening) {
            recognitionRef.current.start();
            setIsListening(true);
            setMicStatus(true);
            console.log('hey from started listening');
            // startTimeout();
        // }
        // recognitionRef.current.start();
        // setIsListening(true);

    }

    const stopListening = () => {
        console.log("stopped listening")
        if (recognitionRef.current && isListening) {
            // console.log("text:", transcript);
            setFinalTranscript(transcript);
            console.log("final transcript:", finalTranscript);
            console.log("transcript:", transcript);
            recognitionRef.current.stop();
            setIsListening(false);
            setMicStatus(false);
            // clearTimeout(timeoutRef.current);
        }
    }

    useEffect(() => {
        if (finalTranscript !== "") {
            console.log("final transcript:", finalTranscript);
        }
    }, [finalTranscript])

    // const startTimeout = () => {
    //     clearTimeout(timeoutRef.current); // Clear any existing timeout
    
    //     timeoutRef.current = setTimeout(() => {
    //         stopListening();
    //     }, 3000);
    // };




    return {
        isListening,
        setIsListening,
        transcript,
        startListening,
        stopListening,
        finalTranscript,
        setFinalTranscript,
        micStatus,
        setMicStatus
    }
}

export default useSpeechToText

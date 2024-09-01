'use client'

import { useState, useEffect, useRef } from "react";
import useSpeechToText from "./components/useSpeechTotext.jsx";

const Record = () => {
  const language = "en-IN";

  const { isListening, setIsListening, startListening, stopListening } =
    useSpeechToText({ continuous: true, lang: language });

  const socket = useRef(null);
  const recordRTC = useRef(null);
  const audio = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [urlQueue, setUrlQueue] = useState([]);
  const [recording, setRecording] = useState(false);
  const [audioQueue, setAudioQueue] = useState([]);
  const [transcript, setTranscript] = useState();

  const handleMicClick = () => {
    if (!isListening) {
      socket.current = new WebSocket(process.env.NEXT_PUBLIC_VOICE_BOT_URL);

      socket.current.onopen = () => {
        console.log('WebSocket connected');
        setIsListening(true);
        startRecording();
      };

      socket.current.onclose = () => {
        console.log('WebSocket closed');
        setIsListening(false);
        socket.current = null;
        stopRecording();
      };
      socket.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        toast.error('WebSocket error:', err);
      };

      socket.current.onmessage = (event) => {
        console.log('Received data:', event.data);
        if (typeof event.data === 'string') {
          const jsonData = JSON.parse(event.data);
          if (jsonData.final) {
            if (audio.current) {
              audio.current.pause();
              setAudioPlaying(false);
              setUrlQueue([]);
            }
            console.log('Final Data:', jsonData.final);
            setTranscript(jsonData.final)
          }
        }
        else if (event.data instanceof Blob) {
          console.log("Blob Data:", event.data);
          getAudioBuffer(event.data);
        }
      };
    }
    else {
      setIsListening(false);
      setTranscript();
      if (audio.current) {
        audio.current.pause();
        setAudioPlaying(false);
        setUrlQueue([]);
      }
      stopRecording();
      socket.current.close();
      socket.current.onclose = () => {
        console.log('WebSocket closed');
      };
      socket.current = null;
    }
  }

  const startRecording = async () => {
    try {
      const RecordRTC = (await import("recordrtc")).default;

      if (recordRTC.current) {
        recordRTC.current.stopRecording();
        recordRTC.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordRTC.current = RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav', // Use WAV format
        numberOfAudioChannels: 1, // Mono
        timeSlice: 500, // Send data every 0.5 second
        desiredSampRate: 16000,
        sample_width: 2,
        bits_per_sample: 16,
        ondataavailable: (blob) => {
          console.log('Raw Blob Data:', blob);
          sendData(blob);
        },
        recorderType: RecordRTC.StereoAudioRecorder,
      });

      recordRTC.current.startRecording();
      console.log('Recording started');
      console.log('RecordRTC:', recordRTC.current);
      recordRTC.current.stream = stream;
      console.log('RecordRTC Stream:', recordRTC.current.stream);
      setRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Error accessing microphone');
    }
  };

  const sendData = async (data) => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      console.log('Sending data:', data);
      socket.current.send(data);
    }
  };

  useEffect(() => {
    if (urlQueue.length > 0) {
      if (!audioPlaying && urlQueue.length > 0) {
        console.log('Playing audio:', urlQueue[0]);
        console.log("is Audio PLaying :", audioPlaying)
        const nextAudioUrl = urlQueue.shift();
        handleAudioPlay(nextAudioUrl);
      }
    }
  }, [urlQueue, audioPlaying]);

  const getAudioBuffer = (audioData) => {
    console.log('Received audio data:', audioData);
    const blob = new Blob([audioData], { type: 'audio/wav' });
    console.log('Blob:', blob);
    const blobUrl = URL.createObjectURL(blob);
    console.log('BlobURL:', blobUrl);
    setUrlQueue(prevQueue => {
      const newQueue = [...prevQueue, blobUrl];
      console.log('Previous URL queue:', prevQueue);
      console.log('New URL queue:', newQueue);
      return newQueue;
    });
  }

  function handleAudioPlay(audioUrl) {
    if (audioUrl) {
      if (!audioPlaying) {
        setAudioPlaying(true);
        audio.current = new Audio(audioUrl);
        audio.current.load();
        audio.current.playbackRate = 1.10;
        audio.current.oncanplaythrough = async () => {
          console.log('Audio data fully loaded');
          setAudioPlaying(() => {
            return true;
          })
          // stopListening();
          await audio.current.play();
        }
        audio.current.onended = () => {
          console.log('Audio ended');
          setAudioPlaying(false);
          console.log("audioQueue:", audioQueue)
          URL.revokeObjectURL(audioUrl);
        };
        audio.current.onerror = (err) => {
          toast.error('Audio play error:', err, 'MediaError:', err.target.error);
          console.log('Audio error:', err, 'MediaError:', err.target.error);
          console.log("audio src:", audio.src);
          setAudioPlaying(false);
        };
      }
    }
  }

  const stopRecording = () => {
    if (recordRTC.current && recording) {
      console.log('Before stopping:', recordRTC.current.state);
      recordRTC.current.stopRecording(() => {
        console.log('Recording stopped');
        const blob = recordRTC.current.getBlob();
        console.log('Blob:', blob);
        sendData(blob);
      });
      recordRTC.current.stream.getTracks().forEach(track => {
        console.log('Stopping track:', track);
        track.stop();
      });
      console.log('After stopping:', recordRTC.current.state);
      setRecording(false);
    }
  };

  useEffect(() => {
    console.log(isListening);
  }, [isListening]);

  return (
    <div className="h-full w-fit flex flex-col justify-center items-center">
      <div
        className="flex flex-col justify-between items-center rounded-2xl px-8 lg:py-10 bg-transparent bg-record cursor-pointer"
        onClick={handleMicClick}
      >
        <div className="flex flex-col justify-center items-center">
          <div className="text-white font-bold text-2xl">Give it a try.</div>
          <div className="text-white text-base text-center xl:px-10">
            Click the mic to transcribe live in English or select another
            language.
          </div>
        </div>
      </div>
      <div className="text-white bg-[#0a0a0a] rounded-bl-2xl rounded-br-2xl mt-3 p-4 w-full text-base">
        <span className="text-xl font-bold">Transcription</span>
        <div className="bg-[black] px-4 py-2 mt-3 rounded-lg">
          {isListening
            ? transcript || (
              <div className="listening-animation text-center">
                Listening...
              </div>
            )
            : "Click the mic to transcribe live in English or select another language."}
        </div>
      </div>
    </div>
  );
};

export default Record;

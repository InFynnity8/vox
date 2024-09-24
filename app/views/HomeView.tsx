"use client";

// Import necessary modules and components
import { useEffect, useState, useRef } from "react";
import { MdKeyboardVoice } from "react-icons/md";
import { FaStopCircle } from "react-icons/fa";
import { FaPlayCircle } from "react-icons/fa";
import { ImLoop } from "react-icons/im";
import { TbRepeatOff } from "react-icons/tb";
import { MdOutlineKeyboardVoice } from "react-icons/md";
import { FaCirclePause } from "react-icons/fa6";
import { RiFolderMusicFill } from "react-icons/ri";
import { MdOutlineDelete } from "react-icons/md";



// Define a recording slot type
type RecordingSlot = {
  isRecording: boolean;
  recordingComplete: boolean;
  audioUrls: string[]; // Array to store multiple recordings for each slot
  isLooping: boolean; // Indicates whether the current audio file should loop
  playingStatus: string[]; // Array to track the status of each audio file (e.g., "Playing", "Paused", "Stopped")
};

// Export the MicrophoneComponent function component
export default function MicrophoneComponent() {
  // State variables to manage multiple recording slots
  const [recordingSlots, setRecordingSlots] = useState<RecordingSlot[]>([
    {
      isRecording: false,
      recordingComplete: false,
      audioUrls: [],
      isLooping: false,
      playingStatus: [],
    },
    {
      isRecording: false,
      recordingComplete: false,
      audioUrls: [],
      isLooping: false,
      playingStatus: [],
    },
    {
      isRecording: false,
      recordingComplete: false,
      audioUrls: [],
      isLooping: false,
      playingStatus: [],
    },
    {
      isRecording: false,
      recordingComplete: false,
      audioUrls: [],
      isLooping: false,
      playingStatus: [],
    },
  ]);

  // References to store the MediaRecorder instances and audio chunks for each slot
  const mediaRecorderRefs = useRef<(MediaRecorder | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const audioChunksRefs = useRef<Blob[][]>([[], [], [], []]);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  // Function to start recording for a specific slot
  const startRecording = (slotIndex: number) => {
    setRecordingSlots((prev) =>
      prev.map((slot, index) =>
        index === slotIndex
          ? { ...slot, isRecording: true, recordingComplete: false }
          : slot
      )
    );

    // Initialize the MediaRecorder
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorderRefs.current[slotIndex] = new MediaRecorder(stream);
      if (mediaRecorderRefs.current[slotIndex]) {
        mediaRecorderRefs.current[slotIndex]!.ondataavailable = (event) => {
          audioChunksRefs.current[slotIndex].push(event.data);
        };
      
        // Check again before calling start
        if (mediaRecorderRefs.current[slotIndex]) {
          mediaRecorderRefs.current[slotIndex]!.start();
        } else {
          console.error('Media recorder reference became null for slot index:', slotIndex);
        }
      } else {
        console.error('Media recorder reference is null for slot index:', slotIndex);
      }
    
    });
  };

  

  // Function to stop recording for a specific slot
  const stopRecording = (slotIndex: number) => {
    const mediaRecorder = mediaRecorderRefs.current[slotIndex];
  
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRefs.current[slotIndex], {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
  
        setRecordingSlots((prev) =>
          prev.map((slot, index) =>
            index === slotIndex
              ? {
                  ...slot,
                  audioUrls: [...slot.audioUrls, audioUrl],
                  recordingComplete: true,
                  isRecording: false,
                  playingStatus: [...slot.playingStatus, "Stopped"],
                }
              : slot
          )
        );
  
        // Clear the audio chunks for the next recording
        audioChunksRefs.current[slotIndex] = [];
      };
    } else {
      console.error('Media recorder reference is null when trying to stop for slot index:', slotIndex);
    }
  };

  // Toggle recording state for a specific slot
  const handleToggleRecording = (slotIndex: number) => {
    if (recordingSlots[slotIndex]?.isRecording === false) {
      startRecording(slotIndex);
    } else {
      stopRecording(slotIndex);
    }
  };
  
  // Custom play/pause functionality for a specific slot and audio
  const handlePlayPause = (slotIndex: number, audioIndex: number) => {
    const slot = recordingSlots[slotIndex];
  
    if (!slot || !slot.audioUrls[audioIndex]) return; // Ensure slot and audio URL exist
  
    const audioUrl = slot.audioUrls[audioIndex];
  
    if (!audioRefs.current[slotIndex]) {
      audioRefs.current[slotIndex] = new Audio(audioUrl);
    } else if (audioRefs.current[slotIndex]!.src !== audioUrl) {
      audioRefs.current[slotIndex]!.src = audioUrl;
    }
    
    const audio = audioRefs.current[slotIndex]!;
    
  
    if (!audio) return; // Ensure audio instance exists
  
    // Set looping
    audio.loop = slot.isLooping || false;
  
    if (audio.paused) {
      audio.play().then(() => {
        updatePlayingStatus(slotIndex, audioIndex, "Playing");
      }).catch((error) => {
        console.error("Error playing audio:", error);
      });
  
      // Set up event listeners for when audio finishes or pauses
      audio.onended = () => handleAudioEnd(slotIndex, audioIndex);
      audio.onpause = () => updatePlayingStatus(slotIndex, audioIndex, "Paused");
    } else {
      audio.pause();
    }
  };
  
  // Update playing status for a specific slot and audio index
  const updatePlayingStatus = (
    slotIndex: number,
    audioIndex: number,
    status: string
  ) => {
    setRecordingSlots((prev) =>
      prev.map((slot, index) =>
        index === slotIndex
          ? {
              ...slot,
              playingStatus: slot.playingStatus.map((s, i) =>
                i === audioIndex ? status : s
              ),
            }
          : slot
      )
    );
  };
  
  // Handle when audio ends for a specific slot
  const handleAudioEnd = (slotIndex: number, audioIndex: number) => {
    updatePlayingStatus(slotIndex, audioIndex, "Stopped");
  };
  
  // Handle looping for a specific slot
  const toggleLoop = (slotIndex: number) => {
    setRecordingSlots((prev) =>
      prev.map((slot, index) =>
        index === slotIndex ? { ...slot, isLooping: !slot.isLooping } : slot
      )
    );
  };
  
  // Clear all recordings
  const clearAllRecordings = () => {
    setRecordingSlots([
      {
        isRecording: false,
        recordingComplete: false,
        audioUrls: [],
        isLooping: false,
        playingStatus: [],
      },
      {
        isRecording: false,
        recordingComplete: false,
        audioUrls: [],
        isLooping: false,
        playingStatus: [],
      },
      {
        isRecording: false,
        recordingComplete: false,
        audioUrls: [],
        isLooping: false,
        playingStatus: [],
      },
      {
        isRecording: false,
        recordingComplete: false,
        audioUrls: [],
        isLooping: false,
        playingStatus: [],
      },
    ]);
  };
  

  // Cleanup effect when the component unmounts
  useEffect(() => {
    return () => {
      mediaRecorderRefs.current.forEach((recorder) =>
        recorder?.stream.getTracks().forEach((track) => track.stop())
      );
    };
  }, []);

  // Render the microphone component with slots for recording
  return (
    <div className="flex flex-col items-center justify-center w-full space-y-4 p-20 bg-slate-950 xl:h-full">
      <div className="flex absolute h-[400px] w-[400px] xl:h-[600px] xl:w-[600px] lg:h-[550px] lg:w-[550px] md:h-[500px] md:w-[500px] bg-slate-900 rounded-full left-[-200px] top-[-200px] z-[1] opacity-50"/>
      <div className="flex absolute h-[200px] w-[200px] xl:h-[400px] xl:w-[400px] lg:h-[350px] lg:w-[350px] md:h-[300px] md:w-[300px] bg-slate-900 rounded-full left-[-200px] top-[200px] z-[0] opacity-30"/>
      <h1 className=" text-white text-[50px] flex justify-center items-center z-[10]">
        Vox<MdKeyboardVoice className="animate-pulse text-orange-600" />
      </h1>
      <div className=" items-center justify-items-center w-full grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-1 z-[10]">
        {recordingSlots.map((slot, index) => (
          <div
            key={index}
            className={`${ slot.isRecording && "shadow-md shadow-orange-500"} p-10  bg-green-800  flex-row bg-red rounded-xl m-5 h-[300px] w-[250px]`}
          >
            <div className="flex justify-between items-center mb-4 ">
              <div className="flex flex-col justify-center items-center w-full">
                <p className="text-xl font-medium leading-none text-white">
                  Slot {index + 1}{" "}
                </p>
               
              </div>
              {slot.isRecording && (
                <div className="rounded-full w-3 h-3 bg-red-400 animate-pulse" />
              )}
            </div>

            <div className="flex justify-center mt-4 space-x-4">
              {/* Button to start/stop recording */}
              <button
                onClick={() => handleToggleRecording(index)}
                className={`${
                  slot.isRecording
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-orange-600 hover:bg-orange-700 text-white"
                } rounded-full w-12 h-12 focus:outline-none flex items-center justify-center`}
              >
                {slot.isRecording ? (
                  <FaStopCircle className="w-5 h-5 text-white" />
                ) : (
                  <MdOutlineKeyboardVoice className="w-6 h-6" />
                )}
              </button>

              {/* Looping toggle button */}
              <button
                onClick={() => toggleLoop(index)}
                className={`${
                  slot.isLooping ? "bg-green-500" : "bg-gray-300"
                } rounded-full p-2 focus:outline-none w-12 h-12 flex items-center justify-center`}
              >
                {slot.isLooping ? (
                  <ImLoop className="w-4 h-4" />
                ) : (
                  <TbRepeatOff className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Display custom audio playback controls for each recorded file */}
            <div className=" overflow-auto h-28 px-2 my-3">
              {slot.audioUrls.length > 0 && (
                <div className=" space-y-2 ">
                  {slot.audioUrls.map((audioUrl, i) => (
                    <div key={i} className="flex justify-between items-center">
                      {/* Status display */}
                      <span className="text-sm mr-2 text-white flex justify-center items-center">
                      <RiFolderMusicFill className="mr-1 text-orange-600 text-[20px]" /> File {i + 1}
                      </span>

                      {/* Custom Play/Pause button */}
                      <button
                        onClick={() => handlePlayPause(index, i)}
                        className=" text-white rounded-md px-2 py-1 focus:outline-none"
                      >
                        {slot.playingStatus[i] === "Playing" ? (
                         <FaCirclePause className="w-5 h-5 text-orange-600 hover:text-orange-700" />
                        ) : (
                          <FaPlayCircle className="w-5 h-5 text-orange-600 hover:text-orange-700" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground  text-white text-center">
                  { `Recorded ${slot.audioUrls.length} file(s).`
                    }
                </p>
          </div>
        ))}
      </div>

      {/* Clear all recordings button */}
      <button
        onClick={clearAllRecordings}
        className="mt-4 bg-red-600 hover:bg-red-700 text-white rounded-md px-4 py-2 focus:outline-none flex justify-center items-center tooltip"
      >
         <MdOutlineDelete className="text-[20px]"/>
      </button>
    </div>
  );
}

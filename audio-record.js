const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function recordingAudio(players, total){
    return new Promise(async function (resolve){
        //criar um contexto de áudio para mesclar todos os áudios
        // var offline = new OfflineAudioContext(2,44100*40,44100);
        var offline = new OfflineAudioContext(2,44100 * total, 44100);
        
        var offset = 0;
        for(var p in players){  
            // gera um buffer para cada áudio
            offset = await getFile(players[p].src).then(track => playTrack(track, offline, offset));
            //insere a duração do vídeo para ter um delay no start do próximo vídeo
            offset += players[p].duration;
        }; 
        
        offline.startRendering().then(function(renderedBuffer) {
            console.log('Rendering and merging audio buffers completed successfully');
                        
            var dest = audioCtx.createMediaStreamDestination();
            var source = audioCtx.createBufferSource();
            
            source.buffer = renderedBuffer;
            var audioRecorder = new MediaRecorder(dest.stream);
            source.connect(dest)
            
            var chunks = [];
            audioRecorder.ondataavailable = function(evt) {
                chunks.push(evt.data);
            };
            
            audioRecorder.onstop = function() {
                console.log('Converting audio buffer to blob completed successfully', chunks);                
                resolve(chunks);
            };

            audioRecorder.start();
            
            source.onended = function(){
                audioRecorder.requestData();
                audioRecorder.stop();
            }
            
            source.start();
        });
    });
}


// function for fetching the audio file and decode the data
async function getFile(filepath) {
    const response = await fetch(filepath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    return audioBuffer;
}

let offset = 0;
// create a buffer, plop in data, connect and play -> modify graph here if required
function playTrack(audioBuffer, offline, offset) {
    
    // check if context is in suspended state (autoplay policy)
    if (audioCtx.state === 'suspended')
        audioCtx.resume();
        
    const trackSource = offline.createBufferSource();
    trackSource.buffer = audioBuffer;
    trackSource.connect(offline.destination)
    trackSource.start(offset);
    
    return offset;
}

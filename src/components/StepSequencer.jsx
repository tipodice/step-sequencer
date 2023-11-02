/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Players, Transport, Loop } from 'tone';
import { useRef } from 'react';


function StepSequencer({rows, cols}) {


	const rowNum = rows && rows <= 4 ? rows : 4;
	const colNum = cols && cols == 16 ? cols : 16;
	const samplerRef = useRef();
	const [availableSamples, setAvailableSamples] = useState({});
	const [isPlaying, setIsPlaying] = useState(false);
	const [bpm, setBpm] = useState(120);
	const [loopState, setLoopState] = useState(false);
	const currentSampleRef = useRef({ 0: 44, 1: 6, 2: 5, 3: 10 });
	//
	const isCheckedRef = useRef(Array(rowNum).fill(0).map(() => Array(colNum).fill(false)));
	const currentColumnsRef = useRef(0);
	const stepsRef = useRef([]);
	const loopRef = useRef();


	useEffect(() => {
		Transport.bpm.value = bpm;
	}, [bpm])
	//
	useEffect(() => {
		stepsRef.current = document.querySelectorAll('.step');
	})
	//
	useEffect(() => {
		fetch('https://raw.githubusercontent.com/tipodice/samples/main/random/file_list.json')
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(data => {
				const urls = {};
				data.files.forEach((sample, index) => {
					urls[index] = sample;
				});
				samplerRef.current = new Players({
					urls: urls,
					fadeOut: '64n',
					baseUrl: 'https://raw.githubusercontent.com/tipodice/samples/main/random/'
				}).toDestination();
				setAvailableSamples(data.files);
			})
			.catch(error => {
				console.error('There was a problem fetching the data:', error);
			});
	}, []);


	const startSequence = () => {
		setIsPlaying(true);
		Transport.start();

		loopRef.current = new Loop((time) => {

			if (currentColumnsRef.current === colNum) {
				currentColumnsRef.current = 0;  // once reach last column
			}

			isCheckedRef.current.forEach((row, index) => {
				const weight = index / 100000;
				if (isCheckedRef.current[index][currentColumnsRef.current]) {
					samplerRef.current.player(currentSampleRef.current[index]).start(time + weight); // play if notebox is selected
				}
			})

			stepsRef.current.forEach((step, index) => {
				step.classList.toggle('step-opacity', index === currentColumnsRef.current); // show step effect
			});

			currentColumnsRef.current++;

		}, "8n").start(0);

		Transport.bpm.value = bpm;
		setLoopState(loopRef.current.state);
	}
	//
	const stopSequence = () => {

		setIsPlaying(false);

		Transport.stop();
		loopRef.current.stop(0);

		setLoopState(loopRef.current.state);
	}
	//
	const handleNoteBox = (noteBox) => {
		const isChecked = noteBox.target.classList.contains('checked');

		if (!isChecked) {
			const col = noteBox.target.getAttribute('data-column');
			const row = noteBox.target.getAttribute('data-row');
			isCheckedRef.current[row][col] = true;
		} else {
			const col = noteBox.target.getAttribute('data-column');
			const row = noteBox.target.getAttribute('data-row');
			isCheckedRef.current[row][col] = false;
		}

		noteBox.target.classList.toggle('checked');
	}
	//
	const handleBpm = (e) => {
		const newValue = parseInt(e.target.value, 10);

		if (newValue >= 60 && newValue <= 600) {
			setBpm(newValue);
		}

	};
	//
	const setSample = (id, value) => {
		currentSampleRef.current[parseInt(id)] = parseInt(value);

		if (loopState) {
			stopSequence();
			startSequence();
		}

	}


	return (
		<div className="App">
			<div className='container-fluid p-1 bg-dark sequencer-container'>
				<div className='row sequencer-title row-margin'>
					<h1>Step Sequencer</h1>
					<hr />
				</div>

				<div className='row row-margin'>
					<div className='container-fluid p-1 d-grid'>
						{isCheckedRef.current.map((row, rowIndex) => (
							<div key={rowIndex} className='row row-margin'>
								<div className='col'>
									<select id={rowIndex}
										className="form-select"
										aria-label="Default select example"
										onChange={(e) => setSample(parseInt(e.target.id), parseInt(e.target.value))}>
										{Object.keys(availableSamples).map(index => (
											<option key={index} value={index}>
												{availableSamples[index]}
											</option>
										))}
									</select>
								</div>
								{row.map((isChecked, colIndex) => (
									<div key={colIndex} className='col'>
										<div onClick={(e) => handleNoteBox(e)} data-row={rowIndex} data-column={colIndex} className='notebox'></div>
									</div>
								))}
							</div>
						))}
						<div className='row row-margin'>
							<div className='col' style={{ opacity: 0 }}>
								<select className="form-select" aria-label="Default select example">
									<option value="1">One</option>
									<option value="2">Two</option>
									<option value="3">Three</option>
								</select></div>
							{isCheckedRef.current[0].map((col, index) => (
								<div key={index} className='col'>
									<div className="step"></div>
								</div>
							))}
						</div>
					</div>

				</div>

				<div className='row sequencer-controls row-margin'>
					<div className='col-md-6 col-sm'>
						<button type="button" className="btn btn-secondary btn-lg bg-trans btn-play" onClick={isPlaying ? stopSequence : startSequence}>
							<svg fill="#1FFF00" xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512"><path d={!isPlaying ? "M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" : "M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z"} /></svg>
						</button>
					</div>
					<div className='col-md-6 col-sm bpm-container'>
						<h6>bpm: </h6><input type="number" min="60" max="600" value={bpm} onChange={(e) => handleBpm(e)} />
					</div>
				</div>
			</div>
		</div >
	);
}


export default StepSequencer;

import dpsLogo from './assets/DPS.svg';
import './App.css';
import { useState, useEffect } from 'react';

const checkData = (value: any, data:any) => {
	let correctData = [];
	let exactMatches = [];
	//let partialMatches = [];
	
	if (typeof(value) === "string") {
		for (let i = 0; i < data.length; i++) {
			if (data[i].name.toLowerCase() === value.toLowerCase()) {
				exactMatches.push(data[i]);
			} 
			// Only include partial matches if no exact matches found
			/*
			else if (data[i].name.toLowerCase().includes(value.toLowerCase())) {
				partialMatches.push(data[i]);
			}
			*/
		}
	}
	else if (typeof(value) === "number") {
		for (let i = 0; i < data.length; i++) {
			if (parseInt(data[i].postalCode) === value) {
				exactMatches.push(data[i]);
			} 

			// Only include partial matches if no exact matches found
			/*
			else if (data[i].postalCode.toString().startsWith(value.toString())) {
				partialMatches.push(data[i]);
			}
			*/
		}
	}
	correctData = [...exactMatches];

	//correctData = [...exactMatches, ...partialMatches];

	return correctData;	
}

const fetchCityName = (postal_code: number) => {
	return fetch(
		`https://openplzapi.org/de/Localities?postalCode=${postal_code}&page=1&pageSize=50`,
	)
	.then((response) => {
		console.log('Response:', response);
		const totalCount = parseInt(response.headers.get('x-total-count') || '0', 10);
		console.log('Response Status (x-total-count):', totalCount);
		const pageSize = 50;
		const totalPages = Math.ceil(totalCount / pageSize);
		console.log('Total Pages:', totalPages);
		
		// Erste Seite bereits geladen, hole restliche Seiten parallel
		const firstPagePromise = response.json();
		const remainingPages = [];
		
		for (let page = 2; page <= totalPages; page++) {
			remainingPages.push(
				fetch(`https://openplzapi.org/de/Localities?postalCode=${postal_code}&page=${page}&pageSize=${pageSize}`)
					.then(r => r.json())
			);
		}
		
		return Promise.all([firstPagePromise, ...remainingPages]);
	})
	.then((allPages) => {
		const allData = allPages.flat();
		console.log('All Data:', allData);
		const filtered = checkData(postal_code, allData);
		console.log('Filtered:', filtered);
		return filtered;
	});
}

const fetchPostalCode = (city_name: string) => {
	return fetch(
		`https://openplzapi.org/de/Localities?name=${city_name}&page=1&pageSize=50`,
	)
	.then((response) => {
		console.log('Response:', response);
		const totalCount = parseInt(response.headers.get('x-total-count') || '0', 10);
		console.log('Response Status (x-total-count):', totalCount);
		const pageSize = 50;
		const totalPages = Math.ceil(totalCount / pageSize);
		console.log('Total Pages:', totalPages);
		
		// Erste Seite bereits geladen, hole restliche Seiten parallel
		const firstPagePromise = response.json();
		const remainingPages = [];
		
		for (let page = 2; page <= totalPages; page++) {
			remainingPages.push(
				fetch(`https://openplzapi.org/de/Localities?name=${city_name}&page=${page}&pageSize=${pageSize}`)
					.then(r => r.json())
			);
		}
		
		return Promise.all([firstPagePromise, ...remainingPages]);
	})
	.then((allPages) => {
		const allData = allPages.flat();
		console.log('All Data:', allData);
		const filtered = checkData(city_name, allData);
		console.log('Filtered:', filtered);
		return filtered;
	});
}




function App() {
	const [postalOptions, setPostalOptions] = useState<any[]>([]);
	const [postalInput, setPostalInput] = useState<string>('');
	const [showSelect, setShowSelect] = useState<boolean>(false);
	const [cityOptions, setCityOptions] = useState<string[]>([]);
	const [cityInput, setCityInput] = useState<string>('');
	const [showCitySelect, setShowCitySelect] = useState<boolean>(false);
	const [allCodes, setAllCodes] = useState<any[]>([]);
	const [selectedInfo, setSelectedInfo] = useState<string>('');

	// Debounced values - diese werden erst nach 1 Sekunde aktualisiert
	const [debouncedCityInput, setDebouncedCityInput] = useState<string>('');
	const [debouncedPostalInput, setDebouncedPostalInput] = useState<string>('');
	const [autoFillCity, setAutoFillCity] = useState<boolean>(false);
	const [autoFillPostal, setAutoFillPostal] = useState<boolean>(false);

	// Debounce für City Input
	// Wartet 1 Sekunde nach der letzten Eingabe, bevor der Wert übernommen wird
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedCityInput(cityInput);
		}, 1000);

		// Cleanup: Timer wird zurückgesetzt, wenn sich cityInput ändert
		return () => clearTimeout(timer);
	}, [cityInput]);

	// Debounce für Postal Input
	// Wartet 1 Sekunde nach der letzten Eingabe, bevor der Wert übernommen wird
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedPostalInput(postalInput);
		}, 1000);

		// Cleanup: Timer wird zurückgesetzt, wenn sich postalInput ändert
		return () => clearTimeout(timer);
	}, [postalInput]);

	// Effect: Führt API-Aufruf aus, wenn debouncedCityInput sich ändert
	// Wird nur getriggert, nachdem Benutzer 1 Sekunde lang nichts mehr tippt
	useEffect(() => {
		if (debouncedCityInput.trim() === '') {
			setShowSelect(false);
			setPostalOptions([]);
			setPostalInput('');
			return;
		}
		if (!showCitySelect && !autoFillCity) {
			fetchPostalCode(debouncedCityInput).then((results: any[]) => {
				let foundCodes = results.map((r: any) => ({
					postalCode: r.postalCode,
					name: r.name,
					district: r.district?.name || 'N/A',
					federalState: r.federalState?.name || 'N/A'
				}))
				setAllCodes(foundCodes);
				const codes = Array.from(new Set(results.map((r: any) => ({
					postalCode: r.postalCode,
					name: r.name
				}))));
				
				if (codes.length > 1) {
					setShowSelect(true);
					setPostalOptions(codes);
					setAutoFillPostal(true);
					setPostalInput('');
					setSelectedInfo('');
					// selectedInfo nicht zurücksetzen - bleibt erhalten wenn bereits gesetzt
				} else if (codes.length === 1) {
					setShowSelect(false);
					setAutoFillPostal(true);
					setPostalOptions([]);
					setPostalInput(codes[0].postalCode ?? '');
					handleDataChange(foundCodes, codes[0].name, codes[0].postalCode);
					// selectedInfo nicht zurücksetzen - bleibt erhalten wenn bereits gesetzt
				} else {
					setShowSelect(false);
					setPostalOptions([]);
					setPostalInput('');
					setAllCodes([]);
					setSelectedInfo('City not found.');
					setAutoFillPostal(false);
					
				}
			
			});
		}
		else {
			setAutoFillCity(false);
		}
	
	}, [debouncedCityInput]);

	// Effect: Führt API-Aufruf aus, wenn debouncedPostalInput sich ändert
	// Wird nur getriggert, nachdem Benutzer 1 Sekunde lang nichts mehr tippt
	useEffect(() => {
		const isFiveDigit = /^\d{5}$/.test(debouncedPostalInput);
		if (isFiveDigit) {
			if (!showSelect && !autoFillPostal) {
				const num = parseInt(debouncedPostalInput, 10);
				updateCitiesFromPostal(num);
			}
			else {
				setAutoFillPostal(false);
				console.log("AutoFillPostal is false now");
			}
		} else if (debouncedPostalInput !== '') {
			setShowCitySelect(false);
			setCityOptions([]);
			setCityInput('');
			setAllCodes([]);
			setSelectedInfo('Invalid postal code.');
		} else {
			if (!autoFillPostal) {
			setShowCitySelect(false);
			setCityOptions([]);
			setCityInput('');
			setAllCodes([]);
			}
			// selectedInfo nur zurücksetzen wenn Input komplett leer
			if (debouncedPostalInput === '' && debouncedCityInput === '') {
				console.log("I do it here");
				setSelectedInfo('');
			}
		}
	}, [debouncedPostalInput]);

	const handleDataChange = (codes: any[], city: string, postal: string) => {
		const matched = codes.find((code: any) => code.name === city && code.postalCode === postal);
		if (matched) {
			setSelectedInfo(`Ort: ${matched.name},\n PLZ: ${matched.postalCode},\n Kreis: ${matched.district},\n Bundesland: ${matched.federalState}`);
		}
	};

	const handleCityChange = (value: string) => {
		setCityInput(value);
		setShowCitySelect(false);
		setCityOptions([]);
	};

	const updateCitiesFromPostal = async (num: number) => {
		
		const results: any[] = await fetchCityName(num);
		const mapped = results.map((r: any) => ({
			postalCode: r.postalCode,
			name: r.name,
			district: r.district?.name || 'N/A',
			federalState: r.federalState?.name || 'N/A'
		}));
		setAllCodes(mapped);
		const cities = Array.from(new Set(results.map((r: any) => String(r.name))));
		if (cities.length > 1) {
			setShowCitySelect(true);
			setCityOptions(cities);
			setAutoFillCity(true);
			setCityInput('');
			setSelectedInfo('');
		} else if (cities.length === 1) {
			setShowCitySelect(false);
			setCityOptions([]);
			setAutoFillCity(true);
			setCityInput(cities[0] ?? '');
			handleDataChange(mapped, mapped[0].name, mapped[0].postalCode);
		} else {
			setShowCitySelect(false);
			setCityOptions([]);
			setCityInput('');
			setAllCodes([]);
			setSelectedInfo('Postal code not found.');
			setAutoFillCity(false);
		}
		return [mapped, cities];
	};

	const handlePostalInputChange = (value: string) => {
		setPostalInput(value);
	};

	const handleSelectChange = async (value: string) => {
		setPostalInput(value);
		//setSelectedInfo('');

				// Find all possible cities for the selected postal code

		/*
		const num = parseInt(value, 10);
		let newCodes: any[] = [];
		let cities: any[] = [];
		let matched: any = null;
		if (!Number.isNaN(num)) {
			let x = await updateCitiesFromPostal(num);
			newCodes = x[0];
			cities = x[1];
		}
		
		console.log("AllCodes on select change:", newCodes);
		if (cities.length === 1 && value !== '' && cities[0] !== '') {
			matched = newCodes.find(code => code.name === cities[0] && code.postalCode === value);
			console.log("Found match for select change:", matched);
			if (matched) {
				setSelectedInfo(`Ort: ${matched.name},\n PLZ: ${matched.postalCode},\n Kreis: ${matched.district},\n Bundesland: ${matched.federalState}`);
				console.log('Matched:', matched);
			}
		}
		else if (value !== '' && cityInput !== ''){
			console.log("Select change:", value, cityInput);
			matched = newCodes.find(code => code.name === cityInput && code.postalCode === value);
			console.log("Found match for select change:", matched);
			if (matched) {
				setSelectedInfo(`Ort: ${matched.name},\n PLZ: ${matched.postalCode},\n Kreis: ${matched.district},\n Bundesland: ${matched.federalState}`);
				console.log('Matched:', matched);
			}
		}
		*/

		// Comment out if using the above block
		
		const isFiveDigit = /^\d{5}$/.test(value);
		if (!isFiveDigit) {
			setShowCitySelect(false);
			setCityOptions([]);
			setCityInput('');
			setAllCodes([]);
			setSelectedInfo('Invalid postal code.');
			return;
		}
		
		// Verwende newCodes statt allCodes - das sind die gerade geladenen Daten
		if (value !== '' && cityInput !== '') {
			console.log("newCodes on select change:", allCodes);
			const matched = (allCodes as any[]).find((code: any) => code.postalCode === value && code.name === cityInput);
			console.log("Found match for select change:", matched);
			if (matched) {
				setSelectedInfo(`Ort: ${matched.name},\n PLZ: ${matched.postalCode},\n Kreis: ${matched.district},\n Bundesland: ${matched.federalState}`);
				console.log('Matched:', matched);
			}
		}

	};

	const handleCitySelectChange = (value: string) => {
		setCityInput(value);
		//setSelectedInfo('');
		// Verwende postalInput statt debouncedPostalInput für sofortige Reaktion
		if (postalInput !== '' && value !== ''){
			const matched = (allCodes as any[]).find((code: any) => code.name === value && code.postalCode === postalInput);
			if (matched) {
				setSelectedInfo(`Ort: ${matched.name},\n PLZ: ${matched.postalCode},\n Kreis: ${matched.district},\n Bundesland: ${matched.federalState}`);
			}
		}

	};

	const handleReset = () => {
		setCityInput('');
		setPostalInput('');
		setCityOptions([]);
		setPostalOptions([]);
		setShowCitySelect(false);
		setShowSelect(false);
		setAllCodes([]);
		setSelectedInfo('');
		setAutoFillCity(false);
		setAutoFillPostal(false);
	};

	return (
		<>
			<div>
				<a href="https://www.digitalproductschool.io/" target="_blank">
					<img src={dpsLogo} className="logo" alt="DPS logo" />
				</a>
			</div>
			<div className="home-card">
				<p>Your solution goes here 😊</p>
				{!showCitySelect ? (
					<input
						type="text"
						name="city_name"
						id="city_name"
						value={cityInput}
						onChange={(e) => handleCityChange(e.target.value)}
					/>
				) : (
					<select
						name="multi_city"
						id="multi_city"
						value={cityInput}
						onChange={(e) => handleCitySelectChange(e.target.value)}
					>
						<option value="" disabled>
							Alle Orte Optionen ({cityOptions.length} Stk.)
						</option>
						{cityOptions.map((city) => (
							<option key={city} value={city}>
								{city}
							</option>
						))}
					</select>
				)}
				{!showSelect ? (
					<input
						type="text"
						name="single_postal_code"
						id="single_postal_code"
						value={postalInput}
						onChange={(e) => handlePostalInputChange(e.target.value)}
					/>
				) : (
					<select
						name="multi_postal_code"
						id="multi_postal_code"
						value={postalInput}
						onChange={(e) => handleSelectChange(e.target.value)}
					>
						<option value="" disabled>
							Alle Postleitzahl Optionen ({postalOptions.length} Stk.)
						</option>
						{postalOptions.map((code) => (
							<option key={code.postalCode} value={code.postalCode}>
								{code.postalCode} {/* Important for partial solution - {code.name} */}
							</option>
						))}
					</select>
				)}
				{selectedInfo !== '' &&
					<div className="multiline">
						{selectedInfo}
					</div>
				}

				<button type="reset" onClick={handleReset}>Reset</button>
			</div>
		</>
	);
}

export default App;

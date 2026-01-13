import dpsLogo from './assets/DPS.svg';
import './App.css';
import { useState, useEffect } from 'react';

const checkData = (value: any, data:any) => {
	let exactMatches = [];
	
	if (typeof(value) === "string") {
		for (let i = 0; i < data.length; i++) {
			if (data[i].name.toLowerCase() === value.toLowerCase()) {
				exactMatches.push(data[i]);
			}
		}
	}
	else if (typeof(value) === "number") {
		for (let i = 0; i < data.length; i++) {
			if (parseInt(data[i].postalCode) === value) {
				exactMatches.push(data[i]);
			}
		}
	}

	return exactMatches;	
}

const fetchLocalities = (searchParam: string | number, paramType: 'postalCode' | 'name') => {
	const queryParam = paramType === 'postalCode' ? `postalCode=${searchParam}` : `name=${searchParam}`;
	
	return fetch(
		`https://openplzapi.org/de/Localities?${queryParam}&page=1&pageSize=50`,
	)
	.then((response) => {
		const totalCount = parseInt(response.headers.get('x-total-count') || '0', 10);
		const pageSize = 50;
		const totalPages = Math.ceil(totalCount / pageSize);
		const firstPagePromise = response.json();
		const remainingPages = [];
		
		for (let page = 2; page <= totalPages; page++) {
			remainingPages.push(
				fetch(`https://openplzapi.org/de/Localities?${queryParam}&page=${page}&pageSize=${pageSize}`)
					.then(r => r.json())
			);
		}
		
		return Promise.all([firstPagePromise, ...remainingPages]);
	})
	.then((allPages) => {
		const allData = allPages.flat();
		const filtered = checkData(searchParam, allData);
		return filtered;
	});
}

const fetchCityName = (postal_code: number) => fetchLocalities(postal_code, 'postalCode');
const fetchPostalCode = (city_name: string) => fetchLocalities(city_name, 'name');




function App() {
	const [postalOptions, setPostalOptions] = useState<any[]>([]);
	const [postalInput, setPostalInput] = useState<string>('');
	const [showPostalSelect, setshowPostalSelect] = useState<boolean>(false);
	const [cityOptions, setCityOptions] = useState<string[]>([]);
	const [cityInput, setCityInput] = useState<string>('');
	const [showCitySelect, setShowCitySelect] = useState<boolean>(false);
	const [allCodes, setAllCodes] = useState<any[]>([]);
	const [selectedInfo, setSelectedInfo] = useState<string>('');
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

	useEffect(() => {
		if (debouncedCityInput.trim() === '') {
			setshowPostalSelect(false);
			setPostalOptions([]);
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
					setshowPostalSelect(true);
					setPostalOptions(codes);
					setAutoFillPostal(true);
					setPostalInput('');
					setSelectedInfo('');
				} else if (codes.length === 1) {
					setshowPostalSelect(false);
					setAutoFillPostal(true);
					setPostalOptions([]);
					setPostalInput(codes[0].postalCode ?? '');
					handleDataChange(foundCodes, codes[0].name, codes[0].postalCode);
				} else {
					if (!autoFillCity) {
					setshowPostalSelect(false);
					setPostalOptions([]);
					setAllCodes([]);
					setSelectedInfo('City not found.');
					setAutoFillPostal(false);
					setPostalInput('');
					}
				}
			
			});
		}
		else {
			setAutoFillCity(false);
		}
	
	}, [debouncedCityInput]);

	useEffect(() => {
		const isFiveDigit = /^\d{5}$/.test(debouncedPostalInput);
		if (isFiveDigit) {
			if (!showPostalSelect && !autoFillPostal) {
				const num = parseInt(debouncedPostalInput, 10);
				updateCitiesFromPostal(num);
			}
			else {
				setAutoFillPostal(false);
			}
		} else if (debouncedPostalInput !== '' && !autoFillPostal) {
			setShowCitySelect(false);
			setCityOptions([]);
			setAutoFillCity(true);
			setCityInput('');
			setAllCodes([]);
			setSelectedInfo('Invalid postal code.');
		} else {
			if (!autoFillPostal) {
				setShowCitySelect(false);
				setCityOptions([]);
				setAllCodes([]);
			}
			if (debouncedPostalInput === '' && debouncedCityInput === '') {
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
			setAutoFillCity(true);
			setCityInput('');
			setAllCodes([]);
			setSelectedInfo('Postal code not found.');
			
		}
		return [mapped, cities];
	};

	const handlePostalInputChange = (value: string) => {
		setPostalInput(value);
	};

	const handleSelectChange = async (value: string) => {
		setAutoFillPostal(true);
		setPostalInput(value);
		
		const isFiveDigit = /^\d{5}$/.test(value);
		if (!isFiveDigit) {
			setShowCitySelect(false);
			setCityOptions([]);
			setAutoFillCity(true);
			setCityInput('');
			setAllCodes([]);
			setSelectedInfo('Invalid postal code.');
			return;
		}
		
		if (value !== '' && cityInput !== '') {
			const matched = (allCodes as any[]).find((code: any) => code.postalCode === value && code.name === cityInput);
			if (matched) {
				setSelectedInfo(`Ort: ${matched.name},\n PLZ: ${matched.postalCode},\n Kreis: ${matched.district},\n Bundesland: ${matched.federalState}`);
			}
		}

	};

	const handleCitySelectChange = (value: string) => {
		setAutoFillCity(true);
		setCityInput(value);
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
		setshowPostalSelect(false);
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
				{!showPostalSelect ? (
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
							{code.postalCode}
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
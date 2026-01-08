import dpsLogo from './assets/DPS.svg';
import './App.css';
import { useState } from 'react';

const checkData = (value: any, data:any) => {
	let correctData = [];
	let exactMatches = [];
	let partialMatches = [];
	
	if (typeof(value) === "string") {
		for (let i = 0; i < data.length; i++) {
			if (data[i].name.toLowerCase() === value.toLowerCase()) {
				exactMatches.push(data[i]);
			} else if (data[i].name.toLowerCase().includes(value.toLowerCase())) {
				partialMatches.push(data[i]);
			}
			correctData = [...exactMatches, ...partialMatches];
		}
	}
	else if (typeof(value) === "number") {
		for (let i = 0; i < data.length; i++) {
			if (parseInt(data[i].postalCode) === value) {
				exactMatches.push(data[i]);
			} else if (data[i].postalCode.toString().startsWith(value.toString())) {
				partialMatches.push(data[i]);
			}
		}
	}

	correctData = [...exactMatches, ...partialMatches];
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
	const [postalOptions, setPostalOptions] = useState<string[]>([]);
	const [postalInput, setPostalInput] = useState<string>('');
	const [showSelect, setShowSelect] = useState<boolean>(false);
	const [cityOptions, setCityOptions] = useState<string[]>([]);
	const [cityInput, setCityInput] = useState<string>('');
	const [showCitySelect, setShowCitySelect] = useState<boolean>(false);

	const handleCityChange = (value: string) => {
		setCityInput(value);
		setShowCitySelect(false);
		setCityOptions([]);
		if (value.trim() === '') {
			setShowSelect(false);
			setPostalOptions([]);
			setPostalInput('');
		}
		else{
			fetchPostalCode(value).then((results: any[]) => {
				const codes = Array.from(new Set(results.map((r: any) => String(r.postalCode))));
				if (codes.length > 1) {
					setShowSelect(true);
					setPostalOptions(codes);
					setPostalInput('');
				} else if (codes.length === 1) {
					setShowSelect(false);
					setPostalOptions([]);
					setPostalInput(codes[0] ?? '');
				} else {
					setShowSelect(false);
					setPostalOptions([]);
					setPostalInput('');
				}
			});
		}
	};

	const updateCitiesFromPostal = (num: number) => {
		fetchCityName(num).then((results: any[]) => {
			const cities = Array.from(new Set(results.map((r: any) => String(r.name))));
			if (cities.length > 1) {
				setShowCitySelect(true);
				setCityOptions(cities);
				setCityInput('');
			} else if (cities.length === 1) {
				setShowCitySelect(false);
				setCityOptions([]);
				setCityInput(cities[0] ?? '');
			} else {
				setShowCitySelect(false);
				setCityOptions([]);
				setCityInput('');
			}
		});
	};

	const handlePostalInputChange = (value: string) => {
		setPostalInput(value);
		const num = parseInt(value, 10);
		if (!Number.isNaN(num)) {
			updateCitiesFromPostal(num);
		}
		else{
			setShowCitySelect(false);
			setCityOptions([]);
			setCityInput('');
		}
	};

	const handleSelectChange = (value: string) => {
		setPostalInput(value);
		const num = parseInt(value, 10);
		if (!Number.isNaN(num)) {
			updateCitiesFromPostal(num);
		}
	};

	const handleCitySelectChange = (value: string) => {
		setCityInput(value);
	};

	const handleReset = () => {
		setCityInput('');
		setPostalInput('');
		setCityOptions([]);
		setPostalOptions([]);
		setShowCitySelect(false);
		setShowSelect(false);
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
				{/* XOR: Entweder Single-Input oder Select je nach Trefferzahl */}
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
							<option key={code} value={code}>
								{code}
							</option>
						))}
					</select>
				)}

				<button type="reset" onClick={handleReset}>Reset</button>
			</div>
		</>
	);
}

export default App;

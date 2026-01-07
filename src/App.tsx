import dpsLogo from './assets/DPS.svg';
import './App.css';

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
		}
	}
	else if (typeof(value) === "number") {
		for (let i = 0; i < data.length; i++) {
			if (data[i].postalCode.toString().startsWith(value.toString())) {
				correctData.push(data[i]);
			}
		}
	}
	
	correctData = [...exactMatches, ...partialMatches];
	return correctData;	
}
const fetchCityName = (postal_code: number) => {
	fetch(
		`https://openplzapi.org/de/Localities?postalCode=${postal_code}&page=1&pageSize=50`,
	)
	.then((response) => response.json())
	.then((data) => console.log(checkData(postal_code, data)));
}

const fetchPostalCode = (city_name: string) => {
	fetch(
		`https://openplzapi.org/de/Localities?name=${city_name}&page=1&pageSize=50`,
	)
	.then((response) => {
		console.log('Response:', response);
		console.log('Response Status:', response.headers.get('x-total-count'));
			// get all response headers and add them together and send response as json
		return response.json();
	})
	.then((data) => console.log(checkData(city_name, data)));
}




function App() {
	return (
		<>
			<div>
				<a href="https://www.digitalproductschool.io/" target="_blank">
					<img src={dpsLogo} className="logo" alt="DPS logo" />
				</a>
			</div>
			<div className="home-card">
				<p>Your solution goes here 😊</p>
				<input type="text" name="city_name" id="city_name" 
				onChange={(e) => fetchPostalCode(e.target.value)}
				/>
				<input type="text" name="single_postal_code" id="single_postal_code" 
				onChange={(e) => fetchCityName(parseInt(e.target.value))}
				/>
				<select name="multi_postal_code" id="multi_postal_code">
					<option value="postal_code_1">Postal Code 1</option>
				</select>
			</div>
		</>
	);
}

export default App;

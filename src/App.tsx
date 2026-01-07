import dpsLogo from './assets/DPS.svg';
import './App.css';

//Test


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
				<input type="text" name="city_name" id="city_name" />
				<input type="text" name="single_postal_code" id="single_postal_code" />
				<select name="multi_postal_code" id="multi_postal_code">
					<option value="postal_code_1">Postal Code 1</option>
				</select>
			</div>
		</>
	);
}

export default App;

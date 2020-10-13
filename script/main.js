const casesToday = document.getElementById("cases-today")
const deathsToday = document.getElementById("deaths-today")
const activeCases = document.getElementById("active-cases")
const totalRecoveries = document.getElementById("total-recoveries")
const totalCases = document.getElementById("total-cases")
const totalDeaths = document.getElementById("total-deaths")

var today;
var yesterday;
var diff;

const table = document.getElementById("overview-table");
const tableBody = table.getElementsByTagName('tbody')[0];

// Some countries have abbreviated names in country population request, this remaps them
const exchanges = (name) => {
    if(name == 'USA') {
        return 'United States of America'
    }

    return name;
};

// Saved values
var historicalCases;
var historicalDeaths;
var historicalRecovered;
var countryPopulations = new Map();

// TODO: CACHE DATA FROM REQUEST

fetchPopulation(() => {
    fetchHistorical(() => {
        fetchData();
    })
})

/**
 * Retrieves and stores historial global covid data from the past month, then runs the given callback.
 * @param {Function} callback 
 */
function fetchHistorical(callback) {
    fetch('https://corona.lmao.ninja/v2/historical/all')
        .then(response => response.json())
        .then(json => {
            historicalCases = json.cases;
            historicalDeaths = json.deaths;
            historicalRecovered = json.recovered;

            callback();
        });
}

function fetchData() {
    fetch(`https://api.covid19api.com/summary`)
        .then(r => r.json())
        .then(response => {
            today = {
                newCases: response.Global.NewConfirmed,
                newDeaths: response.Global.NewDeaths,
                activeCases: response.Global.TotalConfirmed - response.Global.TotalRecovered - response.Global.TotalDeaths,
                totalRecoveries: response.Global.TotalRecovered,
                totalCases: response.Global.TotalConfirmed,
                totalDeaths: response.Global.TotalDeaths
            }

            // Set values for 6 top cards
            setCardValue(casesToday, today.newCases);
            setCardValue(deathsToday, today.newDeaths);
            setCardValue(activeCases, today.activeCases);
            setCardValue(totalRecoveries, today.totalRecoveries);
            setCardValue(totalCases, today.totalCases);
            setCardValue(totalDeaths, today.totalDeaths);

            // Set graphs
            setCardGraph(totalRecoveries, historicalRecovered);
            setCardGraph(totalCases, historicalCases);
            setCardGraph(totalDeaths, historicalDeaths);

            // Set table data
            response.Countries.forEach(element => {
                const row = tableBody.insertRow();

                // Create cell elements for each value
                const country = createCell(row);
                const casesToday = createCell(row);
                const casesActive = createCell(row);
                const casesTotal = createCell(row);
                const deathsToday = createCell(row);
                const deathsTotal = createCell(row);
                const casesPer = createCell(row);

                const activeCases = element.TotalConfirmed - element.TotalDeaths - element.TotalRecovered;
                const perMillion = (activeCases / countryPopulations.get(element.Country)) * 1000000;

                // Set values
                country.innerHTML = element.Country;
                casesToday.innerHTML = element.NewConfirmed;
                casesActive.innerHTML = activeCases;
                casesTotal.innerHTML = element.TotalConfirmed;
                deathsToday.innerHTML = element.NewDeaths;
                deathsTotal.innerHTML = element.TotalDeaths;

                if(perMillion) {
                    casesPer.innerHTML = parseFloat(perMillion).toFixed(1);
                } else {
                    casesPer.innerHTML = "N/A";
                }
            });

            sorttable.makeSortable(table);
            // sort();
            fetchYesterday();
        });
}

/**
 * Fetches pand stores population data for each country, then runs the given callback.
 * @param {Function} callback 
 */
function fetchPopulation(callback) {
    fetch('https://corona.lmao.ninja/v3/covid-19/countries')
        .then(response => response.json())
        .then(response => {
            response.forEach(countryData => {
                countryPopulations.set(exchanges(countryData.country), countryData.population);
            });

            callback();
        });
}

function fetchYesterday() {
    const todayDate = new Date();
    const yesterdayDate = new Date();

    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    const s = `https://api.covid19api.com/world?from=${yesterdayDate.getFullYear()}-${yesterdayDate.getMonth() + 1}-${String(yesterdayDate.getDate()).padStart(2, '0')}T00:00:00Z&to=${todayDate.getFullYear()}-${todayDate.getMonth() + 1}-${String(todayDate.getDate()).padStart(2, '0')}T00:00:00Z`

    fetch(s)
        .then(response => response.json())
        .then(response => {
            response = response[0];

            yesterday = {
                newCases: response.NewConfirmed,
                newDeaths: response.NewDeaths,
                activeCases: response.TotalConfirmed - response.TotalRecovered - response.TotalDeaths,
                totalRecoveries: response.TotalRecovered,
                totalCases: response.TotalConfirmed,
                totalDeaths: response.TotalDeaths
            }

            diff = subtract(today, yesterday);

            // Set diff values for 6 top cards
            setCardChange(casesToday, diff.newCasesPercentage);
            setCardChange(deathsToday, diff.newDeathsPercentage);
            setCardChange(activeCases, diff.activeCasesPercentage);
            setCardChange(totalRecoveries, diff.totalRecoveriesPercentage);
            setCardChange(totalCases, diff.totalCasesPercentage);
            setCardChange(totalDeaths, diff.totalDeathsPercentage);
        });
}

function subtract(today, yesterday) {
    const newCases = today.newCases - yesterday.newCases;
    const newDeaths = today.newDeaths - yesterday.newDeaths;
    const activeCases = today.activeCases - yesterday.activeCases;
    const totalRecoveries = today.totalRecoveries - yesterday.totalRecoveries;
    const totalCases = today.totalCases - yesterday.totalCases;
    const totalDeaths = today.totalDeaths - yesterday.totalDeaths;

    return {
        newCases: newCases,
        newDeaths: newDeaths,
        activeCases: activeCases,
        totalRecoveries: totalRecoveries,
        totalCases: totalCases,
        totalDeaths: totalDeaths,

        newCasesPercentage: newCases / yesterday.newCases,
        newDeathsPercentage: newDeaths / yesterday.newDeaths,
        activeCasesPercentage: activeCases / yesterday.activeCases,
        totalRecoveriesPercentage: totalRecoveries / yesterday.totalRecoveries,
        totalCasesPercentage: totalCases / yesterday.totalCases,
        totalDeathsPercentage: totalDeaths / yesterday.totalDeaths,
    }
}

function createCell(row) {
    const cell = row.insertCell();
    return cell;
}

function sort() {
    var myTH = document.getElementsByTagName("table-active")[0];
    sorttable.innerSortFunction.apply(myTH, []);
}

function setCardValue(card, data) {
    const labels = card.getElementsByClassName('statistic-labels')[0];
    const value = labels.getElementsByClassName('value')[0];

    // Add value to card
    if (!isNaN(data)) {
        value.innerHTML = new Number(data).toLocaleString();
    } else {
        value.innerHTML = data;
    }
}

function setCardChange(card, data) {
    const labels = card.getElementsByClassName('statistic-labels')[0];
    const value = labels.getElementsByClassName('change')[0];

    // Add value to card
    if (!isNaN(data)) {
        const percentage = data * 100;
        value.innerHTML = new Number(percentage).toFixed(2).toLocaleString() + "%";

        if (percentage < 0) {
            value.style.color = 'green';
        } else if (percentage < 1) {
            value.style.color = 'orange';
        } else {
            value.style.color = 'red';
        }
    } else {
        value.innerHTML = data;
    }
}
function setCardGraph(card, data) {
    const display = card.getElementsByClassName('display')[0];
    const context = display.getContext('2d');
    const formattedData = [];
    const keys = [];

    for (var key in data) {
        formattedData.push({
            x: new Date(key),
            y: data[key]
        });

        keys.push(new Date(key));
    }

    console.log(formattedData);

    var chart = new Chart(context, {
        type: 'line',
        data: {
            labels: keys,
            datasets: [{
                label: 'Cases',
                data: formattedData,
            }]
        },
        options: {
            responsive: false,
            elements: { point: { radius: 0, hitRadius: 10, hoverRadius: 10 } },
            scales: {
                yAxes: [{
                    ticks: {
                        display: false
                    },
                    gridLines: {
                        display: false
                    }
                }],
                xAxes: [{
                    ticks: {
                        display: false
                    },
                    gridLines: {
                        display: false
                    }
                }]
            },
            legend: {
                display: false,
            }
        }
    });
}
let budgetData = {
  categories: []
 };
let chart;

// --- For Caching/Testing
// function saveData() {
//   localStorage.setItem('budgetData', JSON.stringify(budgetData));
//   localStorage.setItem('monthlyIncome', document.getElementById('monthlyIncome').value);
// }
function saveData() {
    fetch("save_budget.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: budgetData.categories, income: document.getElementById('monthlyIncome').value })
    })
    .then(response => response.json())
    .then(data => console.log(data.message))
    .catch(error => console.error("Error saving data:", error));
}

// --- For Caching/Testing
// function loadData() {
//   const storedData = localStorage.getItem('budgetData');
//   const storedIncome = localStorage.getItem('monthlyIncome');
//   if (storedData) {
//     budgetData = JSON.parse(storedData);
//   }
//   if (storedIncome) {
//     document.getElementById('monthlyIncome').value = storedIncome;
//   }
//   renderTable();
//   renderChart();
//   updateBalance();
// }
function loadData() {
    fetch("load_budget.php")
    .then(response => response.json())
    .then(data => {
        budgetData.categories = data.categories || [];
        document.getElementById('monthlyIncome').value = data.income || 0;
        renderTable();
        renderChart();
        updateBalance();
    })
    .catch(error => console.error("Error loading data:", error));
}

function addCategory() {
    // Add a new category with an empty name
    budgetData.categories.push({ name: "", items: [] });
    saveData();
    renderTable();

    // Focus on the input field of the new category
    setTimeout(() => {
        const categoryInputs = document.querySelectorAll('th input[type="text"]');
        if (categoryInputs.length > 0) {
            const newCategoryInput = categoryInputs[categoryInputs.length - 1];
            newCategoryInput.focus();
            newCategoryInput.style.backgroundColor = "#252f3d"; // Highlight with a background color
        }
    }, 0);

    renderChart();
}


function addExpense(categoryIndex) {
  budgetData.categories[categoryIndex].items.push({ name: "", projected: 0, actual: 0 });
  saveData();
  renderTable();
  renderChart();
}

function removeCategory(index) {
  const categoryName = budgetData.categories[index].name || "this category";
  const confirmDelete = confirm(`Are you sure you want to delete the category "${categoryName}"?`);
  if (confirmDelete) {
    budgetData.categories.splice(index, 1);
    saveData();
    renderTable();
    renderChart();
  }
}

function removeExpense(categoryIndex, expenseIndex) {
  const categoryName = budgetData.categories[categoryIndex].name || "this category";
  const expenseName = budgetData.categories[categoryIndex].items[expenseIndex].name || "this expense";
  const confirmDelete = confirm(`Are you sure you want to delete the expense "${expenseName}" from the category "${categoryName}"?`);
  if (confirmDelete) {
    budgetData.categories[categoryIndex].items.splice(expenseIndex, 1);
    saveData();
    renderTable();
    renderChart();
  }
}

function updateValue(categoryIndex, expenseIndex, field, value) {
  if (expenseIndex === null) {
    budgetData.categories[categoryIndex][field] = value;
  } else {
    budgetData.categories[categoryIndex].items[expenseIndex][field] = field.includes("cost") ? parseFloat(value) || 0 : value;
  }
  saveData();
  renderChart();
}

// Please forgive me for this mess in the renderTable() function ;)
function renderTable() {
    const tableBody = document.getElementById("expenseTable");
    tableBody.innerHTML = "";

    budgetData.categories.forEach((category, categoryIndex) => {
        // Category Header Row
        tableBody.innerHTML += `
            <tr>
                <th colspan="6" class="thTitle" style="background-color: #252f3d; color: white; text-align: center; font-size: 2.2em; box-shadow: rgba(150, 150, 193, 0.25) 0px 30px 60px -12px, rgba(0, 0, 0, 0.3) 0px 18px 36px -18px;">
                    <input type="text" 
                           value="${category.name}" 
                           onchange="updateValue(${categoryIndex}, null, 'name', this.value)" 
                           oninput="this.value = this.value.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 30);" 
                           style="background: transparent; border: none; color: white; font-size: 1em; font-weight: bold; text-align: center;">
                </th>
            </tr>
        `;

        // Expenses within Category
        category.items.forEach((expense, expenseIndex) => {
            let diff = expense.actual - expense.projected;
            let row = `<tr>
                <td>${category.name}</td> <!-- Show category name in the "Category" column -->
                <td><input style="font-size: 1em; font-weight: 600;" 
                           type="text" 
                           value="${expense.name}" 
                           onchange="updateValue(${categoryIndex}, ${expenseIndex}, 'name', this.value)" 
                           oninput="this.value = this.value.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 30);">
                </td>
                <td><input style="font-size: 1em; font-weight: 600;" 
                           type="number" 
                           value="${expense.projected}" 
                           onchange="updateValue(${categoryIndex}, ${expenseIndex}, 'projected', this.value)">
                </td>
                <td><input style="font-size: 1em; font-weight: 600;" 
                           type="number" 
                           value="${expense.actual}" 
                           onchange="updateValue(${categoryIndex}, ${expenseIndex}, 'actual', this.value)">
                </td>
                <td style="color: ${diff < 0 ? 'red' : 'green'};">${diff}</td>
                <td>
                    <button style="background-color: #882232; color: #fefefe; font-weight: 600;" 
                            onclick="removeExpense(${categoryIndex}, ${expenseIndex})">Remove</button>
                </td>
            </tr>`;
            tableBody.innerHTML += row;
        });

        // Calculate total actual expenses for the category
        const totalActual = category.items.reduce((sum, item) => sum + (parseFloat(item.actual) || 0), 0);

        // Add a row to display the category total
        tableBody.innerHTML += `
            <tr style="background-color: #161b22; color: #e67132; font-weight: bold;">
                <td colspan="3" style="text-align: right;">Total costs for ${category.name}:</td>
                <td>${totalActual.toFixed(0)},-</td>
                <td colspan="2"></td>
            </tr>
        `;

        // Buttons for Adding Expenses & Removing Category
        tableBody.innerHTML += `<tr>
            <td colspan="6">
                <button style="background-color: #238636; color: #fefefe; font-weight: 600; margin-bottom: 15px;" 
                        onclick="addExpense(${categoryIndex})">Add Expense to ${category.name}</button>
                <button style="background-color: #882232; color: #fefefe; font-weight: 600; margin-bottom: 15px;" 
                        onclick="removeCategory(${categoryIndex})">Remove Category</button>
            </td>
        </tr>`;
    });
}

function updateBalance() {
  const income = parseFloat(document.getElementById('monthlyIncome').value) || 0;

  // Calculate the total of all "Actual Cost" values from all categories
  let totalExpenses = 0;
  budgetData.categories.forEach(category => {
    category.items.forEach(item => {
    totalExpenses += parseFloat(item.actual) || 0;
    });
  });

  // Calculate the balance
  const balance = income - totalExpenses;

  // Update the DOM
  document.getElementById('total-expenses').innerText = `Total Monthly Expenses: ${totalExpenses.toFixed(0)},-`;
  document.getElementById('balance-result').innerText = `Balance: ${balance.toFixed(0)},-`;

  // Save the updated data
  saveData();
}

function renderChart() {
  const ctx = document.getElementById('expenseChart').getContext('2d');
  const chartData = budgetData.categories.map(category => {
    return category.items.reduce((sum, item) => sum + parseFloat(item.actual) || 0, 0);
  });
    
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: budgetData.categories.map(c => c.name),
        datasets: [{
          data: chartData,
          backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40', '#84b56d', '#692cbf', '#00f56a', '#002bc7'],
          color: '#fefefe',
          borderColor: '#fefefe',
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          legend: {
            labels: {
              color: '#fefefe', // White legend text
              font: { size: 16 } // Font size for legend text
            }
          },
          title: {
            display: true,
            text: 'Monthly Expenses:',
            font: { size: 20 }, // Font size for title
            color: '#fefefe' // White title text
          }
        }
      }
    });
  }

loadData();

async function audit(){

  const file = document.getElementById("file").files[0];

  const txHash = prompt("Enter payment transaction hash");

  const formData = new FormData();

  formData.append("contract", file);
  formData.append("txHash", txHash);

  const res = await fetch("http://localhost:3000/audit", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  document.getElementById("result").textContent =
    JSON.stringify(data, null, 2);

}
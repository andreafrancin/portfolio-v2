async function fetchProjectsFromAPI(): Promise<any> {
  const response = await fetch('https://back.andreafrancin.com/api/projects/');
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  const data = await response.json();
  return data;
}

export { fetchProjectsFromAPI };

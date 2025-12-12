/**
 * Example reusable component
 * This demonstrates the component structure for the Lyrathon application
 */

interface ExampleComponentProps {
  title?: string;
  description?: string;
}

export default function ExampleComponent({ 
  title = "Example Component", 
  description = "This is a reusable component." 
}: ExampleComponentProps) {
  return (
    <div className="example-component">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

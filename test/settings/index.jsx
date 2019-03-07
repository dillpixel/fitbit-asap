function Settings(props) {
  return (
    <Page>
      <Section title="Test Settings">
        <TextInput settingsKey="text_input" label="Text Input" />
      </Section>
    </Page>
  );
}

registerSettingsPage(Settings)

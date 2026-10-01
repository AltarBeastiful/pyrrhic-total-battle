/**
 * **The page in place of the app when the calculation kernel cannot load** (W16 E3 S2). The engine runs on
 * WebAssembly only (owner, 2026-10-01: "retire the ts version"), so a browser that has none, or that refuses
 * to compile it, gets this one panel and nothing else: no army, no Generate that could not answer.
 *
 * Offline-safe by construction — it fetches nothing, links nowhere and reads no store; it is built from the
 * kit's `Panel` and stock Mantine text, like the account's callback pages (design rule 23).
 */
import { Center, Stack, Text, Title } from '@mantine/core';

import { Panel } from '@/ui/kit/Panel';

export function WasmRequired() {
  return (
    <Center component="main" mih="100dvh" p="md">
      <Panel
        component="section"
        aria-labelledby="wasm-required-title"
        style={{ maxWidth: '26rem', width: '100%' }}
      >
        <Stack gap="sm">
          <Title order={1} size="h3" id="wasm-required-title">
            WebAssembly required
          </Title>
          <Text>
            Pyrrhic plans your march with WebAssembly, and this browser did not let it run. Update your
            browser, or allow WebAssembly for this site, then reload the page.
          </Text>
        </Stack>
      </Panel>
    </Center>
  );
}

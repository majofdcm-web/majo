"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";

export default function AstryxPruebaPage() {
  const [nombre, setNombre] = useState("");
  const [avisos, setAvisos] = useState(true);
  const [enviado, setEnviado] = useState<string | null>(null);

  return (
    <VStack padding={8} hAlign="center">
      <Card width="100%" maxWidth={480} padding={6}>
        <VStack gap={4}>
          <VStack gap={1}>
            <Heading level={1}>Prueba de Astryx</Heading>
            <Text color="secondary">
              Card, TextInput, Switch y Button con el tema Neutral.
            </Text>
          </VStack>
          <TextInput
            label="Nombre"
            placeholder="Escribe tu nombre"
            value={nombre}
            onChange={setNombre}
            hasClear
          />
          <Switch
            label="Recibir avisos"
            description="Se aplica al instante."
            value={avisos}
            onChange={setAvisos}
          />
          <Button
            label="Guardar"
            variant="primary"
            isDisabled={nombre.trim() === ""}
            onClick={() =>
              setEnviado(`${nombre.trim()} · avisos ${avisos ? "activados" : "desactivados"}`)
            }
          />
          {enviado && <Text color="secondary">Guardado: {enviado}</Text>}
        </VStack>
      </Card>
    </VStack>
  );
}

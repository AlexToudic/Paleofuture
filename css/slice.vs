precision mediump float;

// Built-in attributes.
attribute vec4 a_position;
attribute vec2 a_texCoord;
attribute vec2 a_meshCoord;

uniform mat4 u_projectionMatrix;
uniform vec2 u_textureSize;

void main()
{
    vec4 pos = a_position;

    pos.x += 0.0;
}